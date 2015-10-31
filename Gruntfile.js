module.exports = function(grunt) {
  grunt.initConfig({
    loopback_sdk_angular: {
      services: {
        options: {
          input: './server/server.js',
          output: 'js/lb-services.js'
        }
      }
    },
    docular: {
      groups: [
        {
          groupTitle: 'LoopBack',
          groupId: 'loopback',
          sections: [
            {
              id: 'lbServices',
              title: 'LoopBack Services',
              scripts: [ 'js/lb-services.js' ]
            }
          ]
        }
      ]
    },
    // config of other tasks
  });

  grunt.loadNpmTasks('grunt-loopback-sdk-angular');
  grunt.loadNpmTasks('grunt-docular');
  grunt.registerTask('default', [
    'loopback_sdk_angular'
  ]);
};
