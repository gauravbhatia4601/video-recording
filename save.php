<?php

$data = [];
error_reporting(E_ALL);
ini_set('display_errors', 1);

set_error_handler("someFunction");

function someFunction($errno, $errstr) {
    echo '<h2>Upload failed.</h2><br>';
    echo '<p>'.$errstr.'</p>';
}

function saveVideo()
{    
    $file_idx = 'video-blob';
    $fileName = $_POST['video-filename'];
    $tempName = $_FILES[$file_idx]['tmp_name'];


    if (empty($fileName) || empty($tempName)) {
        if(empty($tempName)) {
            echo 'Invalid temp_name: '.$tempName;
            return;
        }

        echo 'Invalid file name: '.$fileName;
        return;
    }

    if(!is_dir('./uploads')){
        @mkdir('./uploads');
    }

    $filePath = 'uploads/' . $fileName;
    
    // make sure that one can upload only allowed audio/video files
    $allowed = array(
        'webm',
        'mp4',
        'mkv',
        'ogg'
    );
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    if (!$extension || empty($extension) || !in_array($extension, $allowed)) {
        $data['status'] = 'NOK';
        $data['error'] = 'Invalid file extension: '.$extension;
        echo 'Invalid file extension: '.$extension;
        return;
    }
    
    if (!move_uploaded_file($tempName, $filePath)) {
        if(!empty($_FILES["file"]["error"])) {
            $listOfErrors = array(
                '1' => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
                '2' => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
                '3' => 'The uploaded file was only partially uploaded.',
                '4' => 'No file was uploaded.',
                '6' => 'Missing a temporary folder. Introduced in PHP 5.0.3.',
                '7' => 'Failed to write file to disk. Introduced in PHP 5.1.0.',
                '8' => 'A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help.'
            );
            $error = $_FILES["file"]["error"];

            if(!empty($listOfErrors[$error])) {
                $data['status'] = 'NOK';
                $data['error'] = $listOfErrors[$error];
                echo $listOfErrors[$error];
            }
            else {
                $data['status'] = 'NOK';
                $data['error'] = 'Not uploaded because of error #'.$_FILES["file"]["error"];
                echo 'Not uploaded because of error #'.$_FILES["file"]["error"];
            }
        }
        else {
            $data['status'] = 'NOK';
            $data['error'] = 'Problem saving file: '.$tempName;
            echo 'Problem saving file: '.$tempName;
        }
        return;
    }else{
        $data['status'] = 'OK';
        $data['message'] = 'Video Uploaded Successfully!';
    }
    echo json_encode($data);
    return;
}

saveVideo();
?>
