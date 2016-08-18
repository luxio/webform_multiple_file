/**
 * Created by lux on 08.08.16.
 */

/**
 * enum for webfform action
 */
var WebformFileActions = {
  PICTURE_UPLOAD: 1,
  PICTURE_RECORD: 2,
  VIDEO_UPLOAD: 3,
  VIDEO_RECORD: 4,
  AUDIO_RECORD: 5,
  PICTURE_MULTIPLE_UPLOAD: 6,
};

/**
 * Implements webform_component_hook_widgetform().
 */
function webform_component_multiple_file_widget_form(form, form_state, entity, entity_type, bundle, component, element) {
  try {
    var element_id = element.options.attributes.id;
    // We'll turn this element into a hidden field, and use children to
    // make the widget(s) to power this component.

    element.type = 'hidden';
    //element.type = 'textfield';

    // Attach a value_callback and the form id to the element so we can assemble the user's
    // input into a JSON object for the element's form state value.
    element.value_callback = 'webform_multiple_file_value_callback';
    element.form_id = form.id;

    // add container for uploaded media
    html = '<div id="' + element_id + '-media"></div>'
    // add media buttons
    html += '<div class="media-buttons-containter">';
    var button = {};

    component.extra.filtering.types.forEach(function (type) {
      console.log(type);
      switch (type) {
        case 'jpg':
          button = webform_mutliple_file_media_button({
            'data-icon': 'fa-camera',
            'data-input_id': element_id,
            'data-action': WebformFileActions.PICTURE_MULTIPLE_UPLOAD // cordova-imagePicker plugin
          });
          html += theme('button', button);
          button = webform_mutliple_file_media_button({
            'data-icon': 'fa-file-image-o',
            'data-input_id': element_id,
            // 'data-action': WebformFileActions.PICTURE_UPLOAD
            'data-action': WebformFileActions.PICTURE_MULTIPLE_UPLOAD // cordova-imagePicker plugin
          });
          html += theme('button', button);
          break;
        case 'mp4':
          button = webform_mutliple_file_media_button({
            'data-icon': 'fa-video-camera',
            'data-input_id': element_id,
            'data-action': WebformFileActions.VIDEO_RECORD
          });
          html += theme('button', button);
          button = webform_mutliple_file_media_button({
            'data-icon': 'fa-file-video-o',
            'data-input_id': element_id,
            'data-action': WebformFileActions.VIDEO_UPLOAD
          });
          html += theme('button', button);
          break;
        case 'mp3':
          button = webform_mutliple_file_media_button({
            'data-icon': 'fa-microphone',
            'data-input_id': element_id,
            'data-action': WebformFileActions.AUDIO_RECORD
          });
          html += theme('button', button);
          break;
      }
    });
    html += '</div>';

    html += '<script type="text/javascript">';
    html += '$("#' + drupalgap_get_page_id() + '").on("pageshow",function(){' +
      'document.addEventListener(' +
      '"deviceready", webform_multiple_file_upload, false );' +
      '});';

    html += '</script>';

    // Add html to the element's children.
    if (element.children) {
      element.children.push({markup: html});
    } else {
      element.children = [{markup: html}];
    }

  }
  catch (error) {
    console.log('webform_component_multiple_file_widget_form  - ' + error);
  }
}

/**
 * create button object
 * @param attributes
 * @returns buttons object
 */
function webform_mutliple_file_media_button(attributes) {
  try {
    var button = {
      text: 'button',
      attributes: {
        // 'data-icon' : icon,
        'data-iconpos': 'notext',
        'data-inline': 'true',
        'data-shadow': 'false',
        'data-theme': 'c',
        'class': 'ui-nodisc-icon webform-mutliple-file-media-button'
      }
    };
    for (var attribute in attributes) {
      button.attributes[attribute] = attributes[attribute];
    }
    return button;
  }
  catch (error) {
    console.log('webform_mutliple_file_media_button  - ' + error);
  }
}


/**
 * upload submitted files
 */
function webform_multiple_file_upload() {
  $(".webform-mutliple-file-media-button").on("click", function (event) {
    // get id of input field
    var input_id = $(this).data("input_id");
    var cardinality = $(this).data("cardinality");
    var action = $(this).data("action");

    function setCameraOptions(srcType, medType) {
      var options = {
        quality: (drupalgap.settings.camera.quality) ? drupalgap.settings.camera.quality : 50,
        sourceType: srcType, // Camera.PictureSourceType.PHOTOLIBRARY, Camera.PictureSourceType.CAMERA,
        destinationType: Camera.DestinationType.FILE_URI,
        mediaType: medType, // Camera.MediaType.VIDEO, Camera.MediaType.PICTURE, Camera.MediaType.ALLMEDIA
        targetWidth: (drupalgap.settings.camera.targetWidth) ? drupalgap.settings.camera.targetWidth : 1024,
        targetHeight: (drupalgap.settings.camera.targetHeight) ? drupalgap.settings.camera.targetHeight : 1024
      };

      return options;
    }

    function captureError(e) {
      console.log("capture error: " + JSON.stringify(e));
    }

    function captureVideoSuccess(s) {
      console.log("Success");
      dpm(s);
      console.dir(s[0]);
      console.log("dpm:");
      dpm(s[0]);
      var mediaHTML = "<video  style='max-width:100%;' controls><source src='" + s[0].fullPath + "'></video>";
      $("#" + input_id + "-media").append(mediaHTML);
      uploadFile([s[0].fullPath]);
    }

    function captureAudioSuccess(s) {
      console.log("Success");
      dpm(s);
      console.dir(s[0]);
      console.log("dpm:");
      dpm(s[0]);
      var mediaHTML = "<audio style='max-width:100%;' controls><source src='" + s[0].fullPath + "'></audio>";
      $("#" + input_id + "-media").append(mediaHTML);
      uploadFile([s[0].fullPath]);
    }

    function uploadFile(files) {
      // upload file
      var uri = encodeURI(Drupal.settings.site_path + "/" + Drupal.settings.endpoint + "/file/create_raw");
      var headers = {'X-CSRF-Token': Drupal.sessid};

      // get first file
      fileURI = files.shift();

      var fileOptions = new FileUploadOptions();
      fileOptions.fileKey = "files[file_1]";
      fileOptions.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
      fileOptions.headers = headers;

      var ft = new FileTransfer();

      // show progress
      ft.onprogress = function (progressEvent) {
        if (progressEvent.lengthComputable) {
          var progress = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          $(".ui-loader h1").replaceWith("<h1>" + t("Uploading") + " " + progress + "%</h1>");
        }
      };

      // show toast
      drupalgap.loader = 'uploading';
      drupalgap_loading_message_show();

      ft.upload(
        fileURI,
        uri,
        function (r) {

          console.log("Code = " + r.responseCode);
          console.log("Response = " + r.response);
          console.log("Sent = " + r.bytesSent);

          var result = $.parseJSON(r.response);
          var fid = result[0].fid;

          // set fid in form
          if (!$("input#" + input_id).val()) {
            $("input#" + input_id).val(fid);
          } else {
            $("input#" + input_id).val($("input#" + input_id).val() + ',' + fid);
          }

          // check for additional files
          if (files.length > 0) {
            uploadFile(files);
          } else {
            drupalgap_loading_message_hide();
          }
        },
        function (error) {
          // error
          drupalgap_loading_message_hide();
          console.log("upload error source " + error.source);
          console.log("upload error target " + error.target);
        },
        fileOptions
      );
    }

    function cameraGetMedia(srcType, medType) {
      var cameraOptions = setCameraOptions(srcType, medType);
      dpm("medType: " + medType);
      navigator.camera.getPicture(function (f) {
        var mediaHTML = "";
        if (medType == Camera.MediaType.PICTURE) {
          mediaHTML = "<img src='" + f + "'>";
        } else if (medType == Camera.MediaType.VIDEO) {
          mediaHTML += "<video  style='max-width:100%;' controls><source src='" + f + "'></video>";
        }
        $("#" + input_id + "-media").append(mediaHTML);
        uploadFile([f]);
      }, function (e) {
        dpm(e);
      }, cameraOptions);
    }

    function imagePickerSuccess(results) {
      try {
        var mediaHTML = '';
        results.forEach(function (image) {
          mediaHTML += "<img src='" + image + "'>";
        });
        $("#" + input_id + "-media").append(mediaHTML);
        uploadFile(results);

      }
      catch (error) {
        console.log('imagePickerSuccess - ' + error);
      }
    }

    switch (action) {
      case WebformFileActions.PICTURE_UPLOAD:
        var srcType = Camera.PictureSourceType.PHOTOLIBRARY;
        var medType = Camera.MediaType.PICTURE;
        cameraGetMedia(srcType, medType);
        break;
      case WebformFileActions.PICTURE_RECORD:
        // Take Picture
        var srcType = Camera.PictureSourceType.CAMERA;
        var medType = Camera.MediaType.PICTURE;
        cameraGetMedia(srcType, medType);
        break;
      case WebformFileActions.VIDEO_UPLOAD:
        // Upload Video
        var srcType = Camera.PictureSourceType.PHOTOLIBRARY;
        var medType = Camera.MediaType.VIDEO;
        cameraGetMedia(srcType, medType);
        break;
      case WebformFileActions.VIDEO_RECORD:
        // Record Video
        navigator.device.capture.captureVideo(captureVideoSuccess, captureError, {limit: 1});
        break;
      case WebformFileActions.AUDIO_RECORD:
        // Record Audi
        navigator.device.capture.captureAudio(captureAudioSuccess, captureError, {limit: 1});
        break;
      case WebformFileActions.PICTURE_MULTIPLE_UPLOAD:
        window.imagePicker.getPictures(imagePickerSuccess, captureError, {
          quality: (drupalgap.settings.camera.quality) ? drupalgap.settings.camera.quality : 50,
          width: (drupalgap.settings.camera.targetWidth) ? drupalgap.settings.camera.targetWidth : 1024,
          height: (drupalgap.settings.camera.targetHeight) ? drupalgap.settings.camera.targetHeight : 1024
        });
        break;
      default:

    }
  })
}

/**
 * Returns JSON with fids
 * @param id
 * @param element
 * @returns {Array}
 */
function webform_multiple_file_value_callback(id, element) {
  try {
    var value = [];
    value = $('#' + id).val().split(',');
    return value;
  }
  catch (error) {
    console.log('webform_multiple_file_value_callback - ' + error);
  }
}
//# sourceURL=webform_multiple_file.js;

