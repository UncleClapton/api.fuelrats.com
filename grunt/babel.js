module.exports = {
  options: {
    presets: ['es2015'],
    sourceMap: true
  },

  dist: {
    files: [{
      cwd: 'src/',
      dest: 'js/',
      expand: true,
      src: ['**/*.js']
    }]
  }
}
