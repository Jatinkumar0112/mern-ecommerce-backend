const { User } = require('../model/User');

exports.fetchUserById = async (req, res) => {
  console.log({req})
  const {id} = req.user;
  console.log({id})
  try {
    const user = await User.findById(id);
    console.log({user})
  
    res.status(200).json({id:user.id, addresses:user.addresses,email:user.email,role:user.role});
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.createUser = async (req, res) => {
  const User = new User(req.body);
  try {
    const doc = await User.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};


exports.updateUser = async (req,res) => {
    const {id} = req.params; 
    try {
      const response = await User.findByIdAndUpdate(id,req.body, {new:true});
      res.status(201).json(response);
    } catch (err) {
      res.status(400).json(err);
    }
}