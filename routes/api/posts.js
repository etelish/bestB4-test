const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

router.post('/', [auth, [
  check('description', 'Description is required')
    .not()
    .isEmpty(),
  check('expiry', 'Expiry is required')
    .not()
    .isEmpty()
]
],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')

      const newPost = new Post({
        description: req.body.description,
        expiry: req.body.expiry,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save()

      res.json(post)

    } catch (err) {
      console.log(err.message)
      res.status(500).send('server Error');
    }
  }
)

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 })
    res.json(posts)
  } catch (err) {
    console.log(err.message)
    res.status(500).send("server error")
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    res.json(post)
  } catch (err) {
    console.log(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' })
    }
    res.status(500).send("server error")
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorised' })
    }

    await post.remove();

    res.json({ msg: 'Post removed' })
  } catch (err) {
    console.log(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' })
    }

    res.status(500).send("server error")
  }
})

module.exports = router;