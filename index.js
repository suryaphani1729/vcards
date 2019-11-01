const express = require("express");
const db = require('./database');
var bodyParser = require('body-parser');
var cors = require('cors');
// var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');
var key = require('./key');

const app = express();

app.use(cors())
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.json({ extended: false }));


const port = process.env.PORT || 3000;

var UserModel = db.mongoose.model('profiles', db.userSchema);
var PersonalModel = db.mongoose.model('personal',db.personalSchema);
var RequestModel = db.mongoose.model('request',db.requestSchema);

//user register
app.post("/register",(req,res) => {

    var reqData = req.body;
    var username=reqData.username;
    var password = reqData.password;

  
    var Profile  = new UserModel({ username: username, password:password });

    UserModel.findOne({ username: username, password:password }, function(err, user) {
     
     if(user)
          res.json({status:0,msg:"Already Registered"});
     else{
          
        Profile.save(function (err) {
               if(err)  res.json({status:0,msg:"Something went wrong"});
                res.json({status:1,msg:"Registered Successfull"});
          });
      }
     });




});
//user login
app.post("/login",  (req, res) => {
   
    var reqData = req.body;
    let username=reqData.username;
    let password = reqData.password;



    UserModel.findOne({ username: username, password:password }, function(err, user) {
       
  // token = jwt.sign({status:1,msg:"Login Successfull",data:user}, key.tokenKey, { algorithm: 'HS256' });
  
        if(user){

          PersonalModel.findOne({ userId: user._id }, function(err, personal) {

            res.json({status:1,msg:"Login Successfull",data:user,personal:personal}).send();  
                
                });


            
        }
        
        else
        res.json( {status:0,msg:"Login Failed, please register"}).send(); 
             
            

     });
   
 
});
//save personal info
//user register
app.post("/getPersonalInfo",(req,res) => {

    var reqData = req.body;
    var userId=reqData.userId;

  
   

    PersonalModel.findOne({ userId: userId }, function(err, user) {
    
     if(user)

             res.json({status:1,msg:"Data available",data:user});
     
        
     else
          
        res.json({status:1,msg:"No data found",data:user});
      
     });




});

//update personal info
app.post("/updatePersonalInfo",(req,res) => {

    var reqData = req.body;
    var userId=reqData.userId;
    var firstname = reqData.firstname;
    var lastname = reqData.lastname;
    var email = reqData.email;
    var mobile = reqData.mobile;
    var address = reqData.address;


     PersonalModel.findOne({userId:userId}, function(err, pm) {
       
        if (pm == null){
            var PersonalInfo  = new PersonalModel({userId, firstname,lastname,email,mobile,address });
            PersonalInfo.save(function (err) {
                if(err)  res.json({status:0,msg:"Something went wrong"});
                 res.json({status:1,msg:"Details Updated Successfull"});
           });
        }
          
        else {
          // do your updates here
          pm.firstname = firstname;
          pm.lastname = lastname;
          pm.email = email;
          pm.mobile = mobile;
          pm.address = address;
                
          pm.save(function(err) {
            if (err)
            res.json({status:0,msg:"Something went wrong"});
            else
            res.json({status:1,msg:"Updated Successfully"});
          });
        }
      });




});
//get friends data

app.post("/getFriendsInfo",(req,res) => {

    var reqData = req.body;
    var userId=reqData.userId;

  
   

    PersonalModel.findOne({ userId: userId }, function(err, user) {
    
     if(user){
        
        PersonalModel.find({userId: { $in : user.friends }},{firstname:1,lastname:1,email:1,mobile:1,address:1},function(err, users) {
           
            res.json({status:1,msg:"Data available",data:users});
        })

    

            
     
            }
     else
          
        res.json({status:1,msg:"No data found",data:user});
      
     });




});

//Send Request
app.post("/sendRequest",(req,res) => {

    var reqData = req.body;
    var userId=reqData.userId;
    var emailId = reqData.emailId;

  
   

    PersonalModel.findOne({ email: emailId }, function(err, user) {
     
     if(!user)
          res.json({status:0,msg:"User Not Registered"});
     else{

        RequestModel.findOne({$or:[{ fromId: userId, toId:user.userId },{toId: userId, fromId:user.userId}]}, function(err, record) {
                
             if(record){
                res.json({status:0,msg:"Requested/Received status is in pending"});
             }else{
                var Request  = new RequestModel({ fromId: userId, toId:user.userId, rDate: new Date() });
                Request.save(function (err) {
                       if(err)  res.json({status:0,msg:"Something went wrong"});
                        res.json({status:1,msg:"Request sent Successfull"});
                  });
             }

        });
    }
  });




});

//Accept Request
app.post("/acceptRequest",(req,res) => {

    var reqData = req.body;
    var requestId=reqData.requestId;
   

    RequestModel.findById(requestId, function(err, user) {
     
     if(user){
          
        PersonalModel.findOne({userId: user.fromId},function(err, friend1){

            if(friend1){

                PersonalModel.findOne({userId: user.toId},function(err, friend2){

                    if(friend2){
        
                      friend1.friends.push(user.toId);
                      friend2.friends.push(user.fromId);
                      friend1.save();
                      friend2.save();
                      RequestModel.findByIdAndRemove(requestId, function (err) {
                        if (err) res.json({status:0,msg:"Something went wrong"});
                        else
                           res.json({status:1,msg:"Friend added successfully"});
                      });

                        
                    }else{
                        res.json({status:0,msg:"Something went wrong"});
                    }
        
        
                })



            }else{
                res.json({status:0,msg:"Something went wrong"});
            }


        })

     }
     else{

        res.json({status:0,msg:"Request not Found"});
    }
  });




});

//Pending Request
app.post("/pendingRequests",(req,res) => {

    var reqData = req.body;
    var userId=reqData.userId;
   

    RequestModel.find({$or:[{ fromId: userId },{toId: userId}]}, function(err, requests) {
     
        if(requests.length==0)
             res.json({status:0,msg:"No Requests Found"});
        else{
            var pFrom = [], pTo = [];
            requests.map((item)=> {item.fromId == userId ? pFrom.push(item.toId) : pTo.push(item.fromId);});

            PersonalModel.find({userId: { $in : [...pFrom,...pTo] }},{firstname:1,lastname:1,email:1,mobile:1,address:1},function(err, users) {
              if(users)
                res.json({status:1,msg:"Data available",data:users,pendingFrom:pFrom,pendingTo:pTo, requests});
                else
                res.json({status:1,msg:"No Data available"});
            })

          
       }
     });





});



db.connectDb().then(async () => {
    app.listen(port, () =>
      console.log(`Example app listening on port 3000`),
    );
  });

