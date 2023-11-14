require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const SQLiteStore = require('connect-sqlite3')(session);
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const   ExtractJwt = require('passport-jwt').ExtractJwt;
const cookieParser = require('cookie-parser');
const productsRouter = require('./routes/Product');
const categoriesRouter = require('./routes/Category');
const brandsRouter = require('./routes/Brands');
const usersRouter = require('./routes/Users');
const authRouter = require('./routes/Auth');
const cartRouter = require('./routes/Cart')
const orderRouter = require('./routes/Order')
const cors = require('cors')
const {User} = require('./model/User');
const { sanitizeUser,isAuth, cookieExtractor} = require('./services/common');
const path = require('path')
// const SECRET_KEY = 'SECRET_KEY';

const token = jwt.sign({ foo: 'bar' }, 'shhhhh');
const server = express()


// webhooks
const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log({paymentIntentSucceeded})
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// JWT options

const opts = {};
opts.jwtFromRequest = cookieExtractor;
// opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey =process.env.JWT_SECRET_KEY; // TODO: should not be in code;

server.use(express.static(path.resolve(__dirname,'build')));
server.use(cookieParser());
server.use(session({
    secret: 'keyboard cat',
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
   
  }));
 
  server.use(passport.authenticate('session'));


server.use(cors({
    exposedHeaders:['X-Total-Count']
}))
server.use(express.json());
server.use('/products',isAuth(),productsRouter.router);
server.use('/category', isAuth(), categoriesRouter.router);
server.use('/brands', isAuth(), brandsRouter.router);
server.use('/users',isAuth(),usersRouter.router);
server.use('/auth',authRouter.router);
server.use('/cart',isAuth(),cartRouter.router);
server.use('/orders',isAuth(),orderRouter.router);
//this line we add to maek react router worker in case of other routes doesnt match
server.get("*", (req, res) =>res.sendFile(path.resolve('build','index.html')))



//passport strategies
passport.use(
  'local',
  new LocalStrategy(
    {usernameField:'email'},
    async function (email, password, done) {
    // by default passport uses username
    try {
      const user = await User.findOne({ email: email });
      console.log(email, password, user);
      if (!user) {
        return done(null, false, { message: 'invalid credentials' }); // for safety
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        'sha256',
        async function (err, hashedPassword) {
          // console.log(hashedPassword);
          // console.log(passport)
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            
            return done(null, false, { message: 'invalid credentials' });
          }
          const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);
         

          done(null, {id:user.id, role:user.role,token}); // this lines sends to serializer
        }
      );
    } catch (err) {
      done(err);
    }
  })
);
//passport jwt
passport.use('jwt',new JwtStrategy(opts, async function(jwt_payload, done) {
  try{
    const user = await User.findById(jwt_payload.id);
    if (user) {
      return done(null,sanitizeUser(user));
  } else {
      return done(null, false);
      // or you could create a new account
  }
  }catch(err){
    if (err) {
      return done(err, false);
  }

  }
  
  
}));
  //creates session variables
  passport.serializeUser(function(user, cb) {
    console.log('serialize', user);
    process.nextTick(function() {
      return cb(null, {id: user.id, role:user.role});
    });
  });
  //this creaters session variable req.user when called from authorised request
  
  passport.deserializeUser(function(user, cb) {
    console.log('de-serialize', user);
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  const stripe = require('stripe')(process.env.STRIPE_SERVER_KEY);

  
server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount, orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100, // for decimal compensation
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata:{
      orderId
      // this info will go to stripe => and then to our webhook
      // so we can conclude that payment was successful, even if client closes window after pay
    }
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});



main().catch(err=>console.log(err));

async function main(){
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("database connected")

}



//middleware

server.get('/',(req,res)=>{
    res.json({status:'sucess'})
})



server.listen(process.env.PORT,()=>{
    console.log("server started")
})