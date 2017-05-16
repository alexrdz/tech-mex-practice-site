var gulp = require('gulp');
var sass = require('gulp-sass');
var size = require('gulp-size'); //shows the size of the entire project or files
var autoprefixer = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var jade = require('gulp-jade');
var base64 = require('gulp-base64');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

//gulp stuff (no watch breaking on errors)
var plumber = require('gulp-plumber');

// browserSync
var browserSync = require('browser-sync');
var reload = browserSync.reload;


// deploy to FTP
var gutil = require('gulp-util');
var ftp = require( 'vinyl-ftp' );

// css
gulp.task('css', function() {
  gulp.src('src/css/main.scss')
    .pipe(plumber())
    //.pipe(sass({outputStyle: ''})
    .pipe(sass({outputStyle: 'compressed'})
      .on('>>> SASS COMPILING ERROR: ', sass.logError))
    .pipe(base64({
      //baseDir: 'public',
      //extensions: ['svg', 'png', 'svg', /\.jpg#datauri$/i],
      //exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
      //maxImageSize: 8*1024, // bytes
      //debug: true
    }))
    .pipe(autoprefixer({
      browsers: ['> 0%'],
      cascade: false
    }))
    .pipe(size())
    .pipe(gulp.dest('www/css'));
});

// js
gulp.task('main_js', function() {
  gulp.src([
    'bower_components/jQuery/dist/jquery.min.js',
    'bower_components/webfontloader/webfontloader.js',
    'bower_components/filterizr/src/jquery.filterizr.js',
    'bower_components/slick-carousel/slick/slick.min.js',
    'bower_components/lightbox2/src/js/lightbox.js',
    'src/js/pace.min.js',
    'src/js/main.js'])
    .pipe(plumber())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(size())
    .pipe(gulp.dest('www/js'));
});

// Jade
gulp.task('jade', function(){
  gulp.src(['src/templates/**.jade'])
    .pipe(plumber())
    .pipe(jade({
        pretty: true
    }))
    .pipe(gulp.dest('www/'));
});

// images
gulp.task('compress_img', function() {
  gulp.src('src/img/**')
    .pipe(imagemin({
      progressive: true,
      optimizationLevel: 1,
      svgoPlugins: [
        {removeViewBox: false},
        {removeDoctype: true},
        {removeComments: true},
        {cleanupNumericValues:
          {floatPrecision: 2}
        },
        {convertColors: {
          names2hex: false,
          rgb2hex: false
        }
      }],
      use: [pngquant()]
    }
  ))
  .pipe(gulp.dest('www/img'))
});

gulp.task('dev:watch', function () {
  gulp.watch('src/templates/**', ['jade']),
  gulp.watch('src/css/**', ['css']),
  gulp.watch('src/js/main.js', ['main_js']),
  gulp.watch('src/img/**',['compress_img']);
});


/* Reload task */
gulp.task('bs-reload', function () {
  browserSync.reload();
});

/* Prepare Browser-sync for localhost */
gulp.task('browser-sync', function () {
  browserSync.init(['www/css/*.css', 'www/js/*.js'], {      
    server: {
      baseDir: './www'
    }
  });
});

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: './www'
    }
  });
});


/* Compile the Site */
gulp.task('compile', ['css', 'main_js', 'compress_img', 'jade']);


/* Default Gulp Task */
gulp.task('default', ['dev:watch', 'serve'], function () {
    gulp.watch(['www/**/*'], ['bs-reload']);
});











/************************************************************************************************************************* http://loige.co/gulp-and-ftp-update-a-website-on-the-fly/
****************************************************************************************************/
/** FTP Configuration **/
var user = process.env.FTP_USER;  
var password = process.env.FTP_PWD;  
var host = 'ftp.horchatadesign.com';
var port = 21;  
var localFilesGlob = ['./www/**/*'];  
var remoteFolder = '/tech-mex.io/';

// helper function to build an FTP connection based on our configuration
function getFtpConnection() {  
  return ftp.create({
    host: host,
    port: port,
    user: user,
    password: password,
    parallel: 5,
    log: gutil.log
  });
}

/**
 * Deploy task.
 * Copies the new files to the server
 *
 * Usage: `FTP_USER=someuser FTP_PWD=somepwd gulp ftp-deploy`
 */
gulp.task('ftp-deploy', function() {

  var conn = getFtpConnection();

  return gulp.src(localFilesGlob, { base: '.', buffer: false })
    .pipe( conn.newer( remoteFolder ) ) // only upload newer files 
    .pipe( conn.dest( remoteFolder ) );
});


/**
 * Watch deploy task.
 * Watches the local copy for changes and copies the new files to the server whenever an update is detected
 *
 * Usage: `FTP_USER=someuser FTP_PWD=somepwd gulp ftp-deploy-watch`
 */
gulp.task('ftp-deploy-watch', function() {

  var conn = getFtpConnection();

  gulp.watch(localFilesGlob)
  .on('change', function(event) {
    console.log('Changes detected! Uploading file "' + event.path + '", ' + event.type);

    return gulp.src( [event.path], { base: '.', buffer: false } )
      .pipe( conn.newer( remoteFolder ) ) // only upload newer files 
      .pipe( conn.dest( remoteFolder ) )
    ;
  });
});

/****************************************************************************************************************************************************************************************************************************/

