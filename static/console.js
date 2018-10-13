
$('#requestValidationButton').click(function() {
  var address = $('#requestValidationAddress').val();

  var block = { address: address };
  $.ajax({
    type: 'POST',
    url: '/requestValidation/',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(block),
    success: function(data) {
      console.log(data);
      $('#requestValidationResults').html(JSON.stringify(data));
      $('#sign-message').val(data.message);
      $('#validate-address').val(data.address);
      $('#validate-signature').val("");
      $('#star-address').val(address);
      $('#lookup-address').val(address);
    },
    error: function(data) {
      $('#requestValidationResults').html('<p style=\"color: red\">Unable to start validation workflow, see console for details</p>');
      console.log(data.responseText);
    }
  });
});

$('#signButton').click(function() {
  var privateKey = $('#sign-key').val();
  var message = $('#sign-message').val();
  var block = {
    privateKey: privateKey,
    message: message
  };
  $.ajax({
    type: 'POST',
    url: '/message-signature/sign/',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(block),
    success: function(data) {
      console.log(data);
      $('#signMessageResults').html(data);
      $('#validate-signature').val(data);
    },
    error: function(data) {
      console.log(data.responseText);
      $('#signMessageResults').html("<p style=\"color: red\">Unable to sign message, see console for details</p>");
    }
  });
});

$('#validateButton').click(function() {
  var address = $('#validate-address').val();
  var signature = $('#validate-signature').val();
  var block = {
        address: address,
        signature: signature
  };
  $.ajax({
    type: 'POST',
    url: '/message-signature/validate/',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(block),
    success: function(data) {
      console.log(data);
      $('#validateResults').html(JSON.stringify(data));
    },
    error: function(data) {
      console.log(data.responseText);
      $('#validateResults').html("<p style=\"color: red\">Unable to validate signature, see console for details</p>");
    }
  });
});

$('#lookupStarButton').click(function() {
  let starName=$('#starname').val();

  $.ajax({
    type: 'GET',
    url: 'http://simbad.u-strasbg.fr/simbad/sim-id?output.format=ASCII&Ident=' + starName,
    success: function(data) {
      let lines = data.split('\n');
      for (i=0; i<lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('Coordinates')) {
          console.log('found coords: ' + line);
          let coords = line;
          if (coords.indexOf(':')>0) {
            coords = coords.substring(coords.indexOf(':')+1)
            if (coords.indexOf('+')>0) {
              let ra = coords.substring(0,coords.indexOf('+'))
              coords = coords.substring(coords.indexOf('+'))
              if (coords.indexOf('(') > 0) {
                let dec= coords.substring(0,coords.indexOf('('))
                console.log('cords: ra: ' + ra + '  dec: ' + dec)
                $('#star-ra').val(ra);
                $('#star-dec').val(dec);
                $('#star-story').val('Found via Simbad restful query');
                $('#lookupStarResults').html('<b>Found Star</b> <i>RA</i> ' + ra + ' <i>DEC</i> ' + dec);
                return;
              }
            }
          }
        }
      }
      alert('Unable to lookup coordinates for star name');
    },
    error: function(data) {
      alert('No information found for star name');
    }
  });
});

$('#starButton').click(function() {
  var address= $('#star-address').val();
  var ra = $('#star-ra').val();
  var dec = $('#star-dec').val();
  var story = $('#star-story').val();

  var block = {
    address: address,
    star: {
      ra: ra,
      dec: dec,
      story: story
    }
  };
  $.ajax({
    type: 'POST',
    url: '/block/',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(block),
    success: function(data) {
      console.log(data);
      $('#submitResults').html(JSON.stringify(data));
    },
    error: function(data) {
      console.log(data.responseText);
      $('#submitResults').html("<p style=\"color: red\">Unable to submit star, see console for details</p>");
    }
  });
});

$('#lookupAddressButton').click(function() {
  var address= $('#lookup-address').val();

  $.ajax({
    type: 'GET',
    url: '/stars/address:' + address,
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      console.log(data);
      $('#starsByAddressResults').html(JSON.stringify(data));
    },
    error: function(data) {
      console.log(data.responseText);
      $('#starsByAddressResults').html("<p style=\"color: red\">Unable to lookup stars, see console for details</p>");
    }
  });
});

$('#lookupHashButton').click(function() {
  var hash= $('#lookup-hash').val();

  $.ajax({
    type: 'GET',
    url: '/stars/hash:' + hash,
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      console.log(data);
      $('#starByHashResults').html(JSON.stringify(data));
    },
    error: function(data) {
      console.log(data.responseText);
      $('#starByHashResults').html("<p style=\"color: red\">Unable to lookup star, see console for details</p>");
    }
  });
});

$('#lookupBlockButton').click(function() {
  var height= $('#lookup-block').val();

  $.ajax({
    type: 'GET',
    url: '/block/' + height,
    contentType: "application/json; charset=utf-8",
    success: function(data) {
      console.log(data);
      $('#starByBlockResults').html(JSON.stringify(data));
    },
    error: function(data) {
      console.log(data.responseText);
      $('#starByBlockResults').html("<p style=\"color: red\">Unable to lookup star, see console for details</p>");
    }
  });
});
