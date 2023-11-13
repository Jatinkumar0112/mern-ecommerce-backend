const { Product } = require("../model/Product");

exports.createProduct = async (req, res) => {
  //this product we have to get from API body

  const product = new Product(req.body);
  try {
    const response = await product.save();
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllProduct = async (req, res) => {
  //this product we have to get from API body
  let condition = {};
  if(req.query.admin){
    condition.deleted = {$ne:true};
    }
  let query = Product.find(condition);
  let totalProductsQuery = Product.find(condition);
  if (req.query.category) {
    query = query.find({ category: req.query.category });
    totalProductsQuery = totalProductsQuery.find({category: req.query.category,});
  }

  if (req.query.brand) {
    query = query.find({ brand: req.query.brand });
    totalProductsQuery = totalProductsQuery.find({ brand: req.query.brand });
  };
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
   
  }

  const totalDocs = await totalProductsQuery.count().exec();
  

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const doc = await query.exec();
    res.set('X-total-Count',totalDocs);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchProductById = async(req,res) =>{
  const {id} = req.params;
  try {
    const response = await Product.findById(id);
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json(err);
  }

}

exports.updateProduct = async (req,res) => {
  const {id} = req.params; 
  try {
    const response = await Product.findByIdAndUpdate(id,req.body, {new:true});
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json(err);
  }

}