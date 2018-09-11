
$('#addBlockButton').click(function() {
  var blockBody = $('#body').val();
  var block = { body: blockBody };
  $.ajax({
    type: 'POST',
    url: '/block/',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(block),
    success: function() {
      loadblock();
    }
  });
});

function loadblock(blockheight=0, arr=[]) {
  $.ajax({
    "url": "/block/" + blockheight,
    statusCode: {
      200: function(data) {
        arr.push(data)
        loadblock(blockheight+1, arr)
      },
      404: function() {
        $('#table').bootstrapTable({
            data: arr
        });
      }
    }
  });
}
$(function () {
 loadblock();
});
