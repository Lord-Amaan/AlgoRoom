const User = require('../models/User')
// so what upsert does is it checks whether user exists in mongoDB or not it may 
// exists in Clerk if it does insert that in mongodb too else do nothing 
// User nahi h to create kardo agar h to return kardo
// Professionally this is called MONGO - CLERK sync step
const upsertUser = async(clerkUserId) =>{
       if(!clerkUserId){
        throw new Error("User not Signed in on clerk")
    }
    const user = await User.findOne({ clerkId: clerkUserId });

    if(!user){
      const createdUser = await User.create({ clerkId: clerkUserId })
      return createdUser
    }
    return user;
 
}

module.exports = { upsertUser }