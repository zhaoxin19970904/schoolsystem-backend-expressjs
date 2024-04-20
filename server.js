const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/ecloud';
const clientSession = require('client-sessions');
const app = express();
const port = 3001;
const jwt = require('jsonwebtoken');
const jwtSecret = 'ecloud';
const studentRouter = require('./router/student');
const teacherRouter = require('./router/teacher');
const userRouter = require('./router/users');
const courseRouter = require('./router/course');


app.use(cors());

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/students', studentRouter);
app.use('/teachers', teacherRouter);
app.use('/users',userRouter);
app.use('/courses',courseRouter);
const Student = require('./models/Student');
const Course = require('./models/Course');



function isAuthenticated(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }

 
  const token = header.split(' ')[1];

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    req.user = decoded;
    next();
  });
}

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.post('/google', async (req, res) => {
  const googletoken = req.body.credential  ;
  const googledecoded = jwt.decode(googletoken);
  const googleemail = googledecoded.email;
  try {
    const student = await Student.findOne({ email: googleemail });

    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }
    const token = jwt.sign({ username: student.username ,role: student.type ,id:student._id}, jwtSecret, { expiresIn: '5h' });

    res.json({ message: 'Login successful', token: token });
  } catch (error) {
    res.status(500).json({ message: 'Error occurred during login' });
  }
})

app.post('/submit', async (req, res) => {
  const { username, password } = req.body;

  try {
    const student = await Student.findOne({ username: username });

    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (password !== student.password) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ username: student.username ,role: student.type ,id:student._id}, jwtSecret, { expiresIn: '5h' });

    res.json({ message: 'Login successful', token: token });
  } catch (error) {
    res.status(500).json({ message: 'Error occurred during login' });
  }
});


app.get('/api',isAuthenticated,(req,res)=>{
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }
  res.json({message: `Welcome !! ${username}`})
})

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});