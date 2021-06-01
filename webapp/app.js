//. app.js
var express = require( 'express' ),
    fs = require( 'fs' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    { exec } = require( 'child_process' ),
    app = express();

var env_python = ( process.env.python ? process.env.python : 'python' );
var env_gpu = ( process.env.GPU ? true : false );
var env_model = ( process.env.model ? process.env.model : 'nin' );
var env_lam = ( process.env.lam ? process.env.lam : 0.02 );  //. #5 デフォルトは 0.005
var chainer_gogh_folder = __dirname + '/../chainer-gogh/';
var sub_command = 'wget https://mydoodles.mybluemix.net/attachment/';

app.use( multer( { dest: './tmp/' } ).single( 'image' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + '/public' ) );

app.post( '/image', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( req.file && req.file.path ){
    if( req.body.sub_id ){
      var sub_id = req.body.sub_id;
      var wget_command = sub_command + sub_id + ' -O ' + __dirname + '/tmp/' + sub_id + '.png';
      console.log( { wget_command } );
      exec( wget_command, function( err0, result0, stderr0 ){
        if( err0 ){
          console.log( { err0 } );
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: err0 } ) );
          res.end();
          /*
        }else if( stderr0 ){
          console.log( { stderr0 } );
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: stderr0 } ) );
          res.end();
          */
        }else{
          //console.log( { result0 } );
          var main_command = 'cd ' + chainer_gogh_folder + ' && ' + env_python + ' chainer-gogh.py' + ( env_lam ? ' --lam ' + env_lam : '' ) +  ' -m ' + env_model + ' -g ' + ( env_gpu ? '0' : '-1' ) + ' -o output_dir/';
          var python_command = main_command + sub_id + ' -i ' + __dirname + '/' + req.file.path + ' -s ' + __dirname + '/tmp/' + sub_id + '.png';
          console.log( { python_command } );

          exec( python_command, function( err1, result1, stderr1 ){
            if( err1 ){   //. <-- 前はエラー？？今は大丈夫？？
              console.log( { err1 } );
              res.status( 400 );
              res.write( JSON.stringify( { status: false, error: err1 } ) );
              res.end();
            }else if( stderr1 ){
              console.log( { stderr1 } );
              res.status( 400 );
              res.write( JSON.stringify( { status: false, error: stderr1 } ) );
              res.end();
            }else{
              console.log( { result1 } );
              res.write( JSON.stringify( { status: true, result: result1 } ) );
              res.end();
            }
          });

          setTimeout( function(){
            fs.unlink( req.file.path, function( err ){} );
            fs.unlink( __dirname + '/tmp/' + sub_id, function( err ){} );

            //. これを返したら上の python プロセスは止まる？
            //. ノンブロッキングなら返す必要ない？
            //res.write( JSON.stringify( { status: true } ) );
            //res.end();
          }, 10000 );
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no sub file.' } ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no main file.' } ) );
    res.end();
  }
});

app.get( '/image/:sub_id', function( req, res ){
  var sub_id = req.params.sub_id;
  if( sub_id ){
    //var chainer_gogh_folder = __dirname + '/../chainer-gogh/';
    var target_folder = chainer_gogh_folder + 'output_dir/' + sub_id;
    fs.readdir( target_folder, function( err, files ){
      if( err ){
        res.contentType( 'application/json; charset=utf-8' );
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        var latest = '';
        files.filter( function( file ){
          return fs.statSync( target_folder + '/' + file ).isFile();
        }).forEach( function( file ){
          if( file > latest ){
            latest = file;
          }
        });

        if( latest ){
          res.contentType( 'image/png' );
          var body = fs.readFileSync( target_folder + '/' + latest );
          res.end( body, 'binary' );
        }else{
          res.contentType( 'application/json; charset=utf-8' );
          res.status( 400 );
          res.write( JSON.stringify( { status: false, error: 'no file generated yet.' } ) );
          res.end();
        }
      }
    });
  }else{
    res.contentType( 'application/json; charset=utf-8' );
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no sub_id.' } ) );
    res.end();
  }
});

app.get( '/finished/:sub_id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var sub_id = req.params.sub_id;
  if( sub_id ){
    //var chainer_gogh_folder = __dirname + '/../chainer-gogh/';
    var target_folder = chainer_gogh_folder + 'output_dir/' + sub_id;
    var exist = fs.existsSync( target_folder + '/im_4950.png' );
    res.write( JSON.stringify( { status: !exist } ) );
    res.end();
  }else{
    res.contentType( 'application/json; charset=utf-8' );
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no sub_id.' } ) );
    res.end();
  }
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
