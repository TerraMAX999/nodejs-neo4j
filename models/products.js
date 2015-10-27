var db = require('./db-neo4j');
var uuid = require('node-uuid');
var crypto = require('crypto');

exports.all = function(req, res, cb){
//	db.listAllLabels(function(err, node){
//		console.log(node);
//		db.readNodesWithLabel("Product", cb);
//	})
	var query = "";
	if (req.params && req.params.customerID){
		console.log("Trying to get Products of Customer:" + req.params.customerID);
		query = "MATCH (customer:User {userID:'" + req.params.customerID + "'})-[r]-(product:Product)"
			+ " RETURN customer.fullName, product.productID, product.manager, product.name, product.customerID";
	}else{
		console.log("Trying to get all Products");
		query = "MATCH (customer:User)-[r]-(product:Product)"
		+ " RETURN customer.fullName, product.productID, product.manager, product.name, product.customerID";
	}

	db.cypherQuery(query, function(err, node){
		if (err)
			return cb(err, node);
		else{
			var result = [];
			for (var i=0; i<node.data.length; i++){
				var item = {
						customer: node.data[i][0],
						productID: node.data[i][1],
						manager: node.data[i][2],
						name: node.data[i][3],
						customerID: node.data[i][4]
				};
				result[result.length] = item;
			}
			return cb(err, result);
		}
	});
}

exports.get = function(req, res, cb){
	if (!req.params.uuid){
		return cb("404", "UUID Missing");
	}
	
	console.log("Trying to read Product:", req.params.uuid);
	db.readNodesWithLabelsAndProperties('Product', {productID: req.params.uuid}, cb);
}

exports.add = function(req, res, cb){
	console.log("Trying to add Product:", req.body)
	
	var _uuid = uuid.v4();
	
	db.insertNode({
		productID: _uuid,
		customerID: req.body.customerID,
		number: req.body.number,
		producttypeID: req.body.producttypeID,
		departmentID: req.body.departmentID,
		upc: req.body.upc,
		style: req.body.style,
		color: req.body.color,
		size: req.body.size,
		min_floor: req.body.min_floor,
		max_floor: req.body.max_floor,
		quantity: req.body.quantity,
		createdDTS: Date.now(),
	}, 'Product', function(err, node){
		if (err)
			return cb("401", "Product Name already exists!");
		else
			cb(err, node);
	});
}

exports.edit = function(req, res, cb){
	var data = {};
	if (!req.params.uuid){
		return cb("404", "UUID Missing");
	}
	
	if (req.body.customerID)
		data.customerID = req.body.customerID;
	if (req.body.number)
		data.number = req.body.number;
	if (req.body.producttypeID)
		data.producttypeID = req.body.producttypeID;
	if (req.body.departmentID)
		data.departmentID = req.body.departmentID;
	if (req.body.upc)
		data.upc = req.body.upc;
	if (req.body.style)
		data.style = req.body.style;
	if (req.body.color)
		data.color = req.body.color;
	if (req.body.size)
		data.size = req.body.size;
	if (req.body.min_floor)
		data.min_floor = req.body.min_floor;
	if (req.body.max_floor)
		data.max_floor = req.body.max_floor;
	if (req.body.quantity)
		data.quantity = req.body.quantity;
	

	console.log("Trying to edit Product:" + req.params.uuid, data);
	db.updateNodesWithLabelsAndProperties('Product', {productID:req.params.uuid}, data, cb);
}

exports.del = function(req, res, cb){
	if (!req.params.uuid){
		return cb("404", "UUID Missing");
	}
	var query = "MATCH (n {productID: '" + req.params.uuid + "'})-[r]-() DELETE n,r";
	console.log("Trying to delete Product:", req.params.uuid);

	db.cypherQuery(query, function(err, node){
		if (err || !node)
			return cb("401", "Failed in deleting Product");
		else{
			query = "MATCH (n {productID: '" + req.params.uuid + "'}) DELETE n";
			db.cypherQuery(query, cb);
			/*db.deleteNodesWithLabelsAndProperties('Product', {productID:req.params.uuid}, function(err, node){
				if (err)
					return cb(err, "Failed in deleting Product");
				if (node === true){
					return cb(err, node);
				}else {
					return cb("401", "Failed in deleting Product due to existing relationships");
				}
			});*/
		}
	});
}

/**
 * Add Relationship between a customer and products.
 * 
 * Parameters
 * @req: req.body.module contains an array of module _ids
 * @res:
 * @node: Newly Inserted Customer
 * @cb: callback function
 */
exports.addRelationshipBetweenCustomer = function(req, res, product, cb){
	console.log("Trying to create relationships FROM Customer:", req.body.customerID);
	console.log("Trying to create relationships TO Product:", product.productID);
	
	var query = "MATCH (customer:User {userID:'" + req.body.customerID + "'}),"
		+ "(product:Product {productID:'" + product.productID + "'})"
		+ " CREATE (customer)-[r:Customer_Product]->(product) RETURN r";

	db.cypherQuery(query, cb);
}
exports.addRelationshipBetweenProducttype = function(req, res, product, cb){
	console.log("Trying to create relationships FROM Producttype:", req.body.producttypeID);
	console.log("Trying to create relationships TO Product:", product.productID);
	
	var query = "MATCH (producttype:Producttype {producttypeID:'" + req.body.producttypeID + "'}),"
		+ "(product:Product {productID:'" + product.productID + "'})"
		+ " CREATE (producttype)-[r:Producttype_Product]->(product) RETURN r";

	db.cypherQuery(query, cb);
}
exports.addRelationshipBetweenDepartment = function(req, res, product, cb){
	console.log("Trying to create relationships FROM Department:", req.body.departmentID);
	console.log("Trying to create relationships TO Product:", product.productID);
	
	var query = "MATCH (department:Department {departmentID:'" + req.body.departmentID + "'}),"
		+ "(product:Product {productID:'" + product.productID + "'})"
		+ " CREATE (department)-[r:Department_Product]->(product) RETURN r";

	db.cypherQuery(query, cb);
}

exports.delRelationships = function(req, res, cb){
	var query = "MATCH (product {productID: '" + req.params.uuid + "'})-[r]-() DELETE r";
	console.log("Trying to delete Product relationships. Product ID:", req.params.uuid);
	db.cypherQuery(query, cb);
}