<?php

// error_log('\n\n-------post');
// foreach($_POST as $k => $v) error_log($k.': '.$v);
// 
// error_log('\n\n-------get');
// foreach($_GET as $k => $v) error_log($k.': '.$v);


//--------------------------------------------------------------------------
// Connect to database
//--------------------------------------------------------------------------

$config = require __DIR__ . '/config.php';
$user = $config['user'];
$db = $config['db'];
$pass = $config['pass'];

$charset = 'utf8mb4';
$dsnServer = "mysql:host={$config['host']};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
  // connect to server without selecting a default database
  $pdo = new PDO($dsnServer, $user, $pass, $options);

  // Try to select the database by connecting directly to it (preferred)
  try {
      $dsnDb = "mysql:host={$config['host']};dbname={$db};charset=utf8mb4";
      $pdoDb = new PDO($dsnDb, $user, $pass, $options);
  } catch (PDOException $e) {
      // If connecting to the named DB failed, attempt to create it (if permitted)
      try {
          // Use IF NOT EXISTS to avoid race-condition errors
          $createSql = "CREATE DATABASE IF NOT EXISTS `" . str_replace('`', '``', $db) . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
          $pdo->exec($createSql);

          // Now connect to the database
          $pdoDb = new PDO($dsnDb, $user, $pass, $options);
      } catch (PDOException $e2) {
          // Log a safe message and stop; don't expose full exception to users
          error_log('Database create/connect error: ' . $e2->getMessage());
          exit('Unable to create or connect to database. Check logs for details.');
      }
  }
  // Use $pdoDb for further queries
  $pdo = $pdoDb;
} catch (PDOException $e) {
  // Fatal connection to server failed
  error_log('Database server connection failed: ' . $e->getMessage());
  exit('Database connection error. Check logs for details.');
}

//--------------------------------------------------------------------------
// Create Tables
//--------------------------------------------------------------------------

$pdo->exec("CREATE TABLE IF NOT EXISTS sharedPatches (
  id        CHAR(10)    PRIMARY KEY,
  data      TEXT        NOT NULL,
  accessed  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

//--------------------------------------------------------------------------
// Status
//--------------------------------------------------------------------------

if(isset($_GET['status'])) {
  echo json_encode(['available' => true]);
  exit;
}

//--------------------------------------------------------------------------
// Shared Patches
//--------------------------------------------------------------------------

if(isset($_GET['share'])) {

  $input      = file_get_contents('php://input');
  $compressed = base64_encode(gzdeflate($input, 9));
  
  $stmt = $pdo->prepare('INSERT INTO sharedPatches (id, data) VALUES (?, ?)');
  
  while (true) {
    $id = bin2hex(random_bytes(5));
    try {
      $stmt->execute([$id, $compressed]);
      $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? 'https' : 'http';
      $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] . (isset($_SERVER['SERVER_PORT']) ? ':' . $_SERVER['SERVER_PORT'] : ''));
      $self = dirname($_SERVER['SCRIPT_NAME']); // returns '/' or '/path'
      $self = rtrim($self, '/'); // remove trailing slash
      $url = $scheme . '://' . $host . ($self === '' ? '' : $self) . '/' . $id;
      echo json_encode(['id' => $id, 'url' => $url]);
      exit;
    }
    catch (PDOException $e) {
      if($e->getCode() !== '23000') {
        // not a duplicate key collision, something else is wrong
        error_log('Insert error: ' . $e->getMessage());
        http_response_code(500);
        exit;
      }
      // duplicate id, try again with a new one
    }
  }
} 

if(isset($_GET['id'])) {

  $id = $_GET['id'];
  $stmt = $pdo->prepare('SELECT data FROM sharedPatches WHERE id = ?');
  $stmt->execute([$id]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  
  if (!$row) {
    echo json_encode(['error' => 'Not found']);
    exit;
  }
  
  $pdo->prepare('UPDATE sharedPatches SET accessed = now() WHERE id = ?')
      ->execute([$id]);
  
  $patch = gzinflate(base64_decode($row['data']));
  echo $patch;
  
  exit;
}

