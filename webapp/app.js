//. app.js
var express = require( 'express' ),
    fs = require( 'fs' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    path = require( 'path' ),
    { exec } = require( 'child_process' ),
    app = express();

var sep = path.sep;

var env_python = ( process.env.python ? process.env.python : 'python' );
var env_gpu = ( process.env.GPU ? true : false );
var env_model = ( process.env.model ? process.env.model : 'nin' );
var env_lam = ( process.env.lam ? process.env.lam : 0.5 );  //. #5 デフォルトは 0.005
var chainer_gogh_folder = __dirname + sep + '..' + sep + 'chainer-gogh' + sep;
var sub_command = 'wget https://mydoodles.mybluemix.net/attachment/';

app.use( multer( { dest: '.' + sep + 'tmp' + sep } ).single( 'image' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + sep + 'public' ) );

var processing = false;
app.post( '/image', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( processing ){
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'still processing.' } ) );
    res.end();
  }else{
    if( req.file && req.file.path ){
      if( req.body.sub_id ){
        processing = true;
        var sub_id = req.body.sub_id;
        var wget_command = sub_command + sub_id + ' -O ' + __dirname + sep + 'tmp' + sep + sub_id + '.png';
        console.log( { wget_command } );
        exec( wget_command, function( err0, result0, stderr0 ){
          if( err0 ){
            processing = false;
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
            var main_command = 'cd ' + chainer_gogh_folder + ' && ' + env_python + ' chainer-gogh.py' + ( env_lam ? ' --lam ' + env_lam : '' ) +  ' -m ' + env_model + ' -g ' + ( env_gpu ? '0' : '-1' ) + ' -o output_dir' + sep;
            var python_command = main_command + sub_id + ' -i ' + __dirname + sep + req.file.path + ' -s ' + __dirname + sep + 'tmp' + sep + sub_id + '.png';
            console.log( { python_command } );
  
            exec( python_command, function( err1, result1, stderr1 ){
              if( err1 ){   //. <-- 前はエラー？？今は大丈夫？？
                processing = false;
                console.log( { err1 } );
                res.status( 400 );
                res.write( JSON.stringify( { status: false, error: err1 } ) );
                res.end();
              }else if( stderr1 ){
                processing = false;
                console.log( { stderr1 } );
                res.status( 400 );
                res.write( JSON.stringify( { status: false, error: stderr1 } ) );
                res.end();
              }else{
                processing = false;
                console.log( { result1 } );
                res.write( JSON.stringify( { status: true, result: result1 } ) );
                res.end();
              }
            });
  
            setTimeout( function(){
              fs.unlink( req.file.path, function( err ){} );
              fs.unlink( __dirname + sep + 'tmp' + sep + sub_id, function( err ){} );
  
              //. これを返したら上の python プロセスは止まる？
              //. ノンブロッキングなら返す必要ない？
              //res.write( JSON.stringify( { status: true } ) );
              //res.end();
            }, 10000 );
          }
        });
      }else{
        processing = false;
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: 'no sub file.' } ) );
        res.end();
      }
    }else{
      processing = false;
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no main file.' } ) );
      res.end();
    }
  }
});

app.get( '/image/:sub_id', function( req, res ){
  var sub_id = req.params.sub_id;
  if( sub_id ){
    //var chainer_gogh_folder = __dirname + '/../chainer-gogh/';
    var target_folder = chainer_gogh_folder + 'output_dir' + sep + sub_id;
    fs.readdir( target_folder, function( err, files ){
      if( err ){
        res.contentType( 'application/json; charset=utf-8' );
        res.status( 400 );
        res.write( JSON.stringify( { status: false, error: err } ) );
        res.end();
      }else{
        var latest = '';
        files.filter( function( file ){
          return fs.statSync( target_folder + sep + file ).isFile();
        }).forEach( function( file ){
          if( file > latest ){
            latest = file;
          }
        });

        if( latest ){
          res.contentType( 'image/png' );
          var body = fs.readFileSync( target_folder + sep + latest );
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
    var target_folder = chainer_gogh_folder + 'output_dir' + sep + sub_id;
    var exist = fs.existsSync( target_folder + sep + 'im_4950.png' );
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
