require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const Message = require('./models/Message');
const {Expo} = require('expo-server-sdk');
const app = express();
const PORT = process.env.PORT || 4001;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extendedL:false}));
app.use(bodyParser.json());
app.use(passport.initialize());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

mongoose.connect(
    process.env.MONGODB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
.then(()=> console.log('connected to mongodb successfully'))
.catch((err)=> console.error('mongodb error: ' + err));

app.listen(PORT, ()=> 
  console.log('listening on port ' + PORT));

// for vercel deployment

app.get("/", (req, res) => {
    res.send("Express on Vercel");
  });

// api for signup

app.post('/api/signup', async(req,res)=>{
    try{
    
    const reqBody = req.body;
    console.log(reqBody);
    const {name, email, password, imageUrl,pushToken} = reqBody;
    const user = new User({name, email, password, imageUrl,pushToken});
    await user.save();
    res.status(200).json({message:'success',id:user._id,success:true});
    }
    catch(error){
        console.log('registrantion server error',error);
        res.status(500).json({message:"Internal Server Error"});
    }
})

// api for login

app.post('/api/login', async(req,res)=>{
    try{
    const {email, password,pushToken} =  req.body;
    const user = await  User.findOne({email});
    if(!user){
      return res.status(404).json({message:'user not found',success:false});
    }
    if(user.password !== password){
       return res.status(404).json({message:'wrong password',success:false});
    }
    const updatedUser = await User.findOneAndUpdate({email}, {pushToken});
     await updatedUser.save();
    console.log(updatedUser);
    return res.status(200).json({message:'success',id: updatedUser._id,success:true});
}
    catch(error){
        console.log('login error', error);
      return   res.status(500).json({message:"Internal Server Error"});
    }
})

// api for seding messages

app.post('/api/message/:id/send', async(req,res)=>{
    try{
    const {content} = req.body;
    const id = req.params.id;
    console.log(req.body);
    const user = User.findOne({_id:id});
    if(!user){
        return res.status(404).json({message:'user not found'});
      }
    // saving message in database
    const message = new Message({
        content,
        sendBy: id
    });
    await message.save();

    //sending push notification to users
    let messages = [];
    
    const users = await User.find();
    users.map((user)=>{
        if (!Expo.isExpoPushToken(user.pushToken)) {
            console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
              return;
          }
        
          messages.push({
            to: user.pushToken,
            title: 'priyansh-messenger-app',
            sound: 'default',
            body: content,
            data: { withSome: 'data' },
          })
    });
    messages.push({
        to: "ExponentPushToken[EbzBdTK3aIOEDSnCpPafD0]",
        sound: 'default',
        title: 'priyansh-messenger-app',
        body: content,
        data: { withSome: 'data' },
      })

    console.log(messages);

    let chunks = expo.chunkPushNotifications(messages);
let tickets = [];
(async () => {
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
})();
     res.status(200).json({message:'message sended successfully'});
    }
    catch(err){
        console.log('messag sending error', err);
        res.status(500).send({message:"Internal Server Error"});
    }
})

// api for getting messages

app.get('/api/messages/get/:id', async(req, res)=>{
    try{
        const id = req.params.id;
        const user = await User.findOne({_id:id});
        if(!user){
            return res.status(400).json({message:'user not found'});
          }
        
          const messages = await Message.find({}).sort({ 'createdAt' : 1}).populate('sendBy','name email imageUrl');
          res.status(200).json({messages});
    }   
    catch(err){
        console.log('messag getting error', err);
        res.status(500).send({message:"Internal Server Error"});
    }
})

// api for verify id

app.get('/api/verify/:id', async(req,res)=>{
    try {
        const user = await User.findOne({_id: req.params.id});
        if(!user){
            return res.status(404).json({success: false, message: 'user not found'})
        }
        res.status(200).json({success: true, message: 'user found'})
    } catch (error) {
        console.log('verify id error', error);
        res.status(500).send({message:"Internal Server Error"});
    }
})

module.exports = app;