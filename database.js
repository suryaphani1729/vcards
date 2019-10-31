const mongoose = require('mongoose');


const connectDb = () => {
  return   mongoose.connect('mongodb+srv://surya123:surya123@contactkeeper-fjc9p.mongodb.net/vcards?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true});
};


const userSchema = new mongoose.Schema({
  username: {    type: String  },
  password: {    type: String  },
});

const personalSchema = new mongoose.Schema({
  firstname: {    type: String  },
  lastname: {    type: String  },
  email: {    type: String  },
  mobile: {    type: String  },
  address: {    type: String  },
  friends: {type: Array},
  userId: {type:String}
});


module.exports = {connectDb,mongoose,userSchema, personalSchema} ;
