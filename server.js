const aws = require('aws-sdk')
const express = require('express')
const multer = require('multer')
const multerS3 = require('multer-s3')
const uuid = require('uuid').v4
const MongoClient = require('mongodb').MongoClient
const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const { DB_HOST, PORT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY = 3005 } = process.env
// const port = 3005

MongoClient.connect(DB_HOST, {
  //   userNewUrlParser: true,
  useUnifiedTopology: true,
}).then(client => {
  console.log('Mongo Connected!')
  const db = client.db('myApp')
  const collection = db.collection('images')
  app.locals.imageCollection = collection
})

// aws credentials..
const s3 = new aws.S3({ apiVersion: '2006-03-01' })

const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'image-upload-storage',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${uuid()}${ext}`)
    },
  }),
})

app.use(express.static('public'))

app.post('/upload', upload.single('appImage'), (req, res) => {
  const imageCollection = req.app.locals.imageCollection

  console.log('IMAGECollection', req.app.locals)
  console.log('FILE IN', req.file)
  const uploaded = req.file.location
  console.log(req.uploaded)
  imageCollection.insert({ filePath: uploaded }).then(result => {
    return res.json({ status: 'OK', ...result })
  })
})

app.get('/images', (req, res) => {
  const imageCollection = req.app.locals.imageCollection
  imageCollection
    .find({})
    .toArray()
    .then(images => {
      const paths = images.map(({ filePath }) => ({ filePath }))
      return res.json(paths)
    })
})

// mongoose
//   .connect(DB_HOST)
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log('Database connection successful')
//       console.log(`Server running. Use our API on port: ${PORT}`)
//     })
//   })
//   .catch(err => {
//     console.log('Error at a server launch', err.message)
//     process.exit(1)
//   })

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
