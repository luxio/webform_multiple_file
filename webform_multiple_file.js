/**
 * Created by lux on 08.08.16.
 */

/**
 * Implements webform_component_hook_widgetform().
 */
function webform_component_multiple_file_widget_form(form, form_state, entity, entity_type, bundle, component, element) {
  try {
    var element_id = element.options.attributes.id;
    var cardinality = component.extra.cardinality;

    // Change the item type to a hidden input to hold the file id.
    //element.type = 'hidden';
    element.type = 'textfield';

    // Attach a value_callback and the form id to the element so we can assemble the user's
    // input into a JSON object for the element's form state value.
    element.value_callback = 'webform_multiple_file_value_callback';
    element.form_id = form.id;

    // check for allowed media types
    var media_types = [];
    component.extra.filtering.types.forEach(function (type) {
      switch (type) {
        case 'jpg':
          media_types.push(MEDIA_TYPES.IMAGE);
          break;
        case 'mp4':
          media_types.push(MEDIA_TYPES.VIDEO);
          break;
        case 'mp3':
          media_types.push(MEDIA_TYPES.AUDIO);
          break;
      }
    });

    // If we already have media for this item, show it.
    var media = '';

    // add container for uploaded media
    var html = '<div id="' + media_field_widget_media_containter_id(element_id) + '"></div>' +
      '<div id="' + element_id + '-media-field-msg"></div>' +
      '<div id="' + element_id + '-media-field">' + media + '</div>' +
      '<div id="' + element_id + '-media-buttons">' +
      media_buttons({
        'media_types': media_types,
        attributes: {
          'data-input_id': element_id,
          'data-cardinality': cardinality,
          'data-form_id': form.id,
          'data-element_name': element.name,
          'data-webform_component_type': component.type,
        }
      }) +
      '</div>';

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

/**
 * Implements hook_form_alter().
 */
function webform_multiple_file_form_alter(form, form_state, form_id) {
  // add custom validate handler
  if (form_id == 'webform_form') {
    form.validate.push('webform_multiple_file_login_validate');
  }
}

/**
 * Custom validation handler for webform form.
 */
function webform_multiple_file_login_validate(form, form_state) {
  try {
    for (var name in form.elements) {
      if (!form.elements.hasOwnProperty(name)) {
        continue;
      }
      var element = form.elements[name];
      if (name == 'submit') {
        continue;
      }
      if (element.component.type != 'multiple_file') {
        continue;
      }
      if (element.required) {
        var valid = true;
        var value = form_state.values[name][0];
        if (empty(value)) {
          valid = false;
        }

        if (!valid) {
          var field_title = name;
          if (element.component.name) {
            field_title = element.component.name;
          }
          drupalgap_form_set_error(
            name,
            t('The') + ' ' + field_title + ' ' + t('field is required') + '.'
          );
        }
      }
    }
  }
  catch (error) {
    console.log('webform_multiple_file_login_validate - ' + error);
  }
}
//# sourceURL=webform_multiple_file.js

