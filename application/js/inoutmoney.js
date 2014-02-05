/**
 * User : Gabriel
 * Date : 12/01/14
 * Time : 12:06 AM
 * Usage: manage the view
 */

var editedIncome,
    editedOutcome,
    editedDescription;

/**
 * Append the new row we want to the current table.
 *
 * @param row {} object containing income,outcome and description
 */
function getNewRow(row, $lastRow) {
    var toAppend = "";
    var newRow;

    //ajax call to our controller, we want a minimum of validation in our dirty string.
    $.ajax({
        url: '/inoutmoney/sanitize_us',
        dataType: "json",
        data: JSON.stringify(row),
        type: 'POST',
        contentType: 'application/json'
    })
    .done(function(safeData) {//process the job when the call is done.
            var tds = [safeData.income, safeData.outcome, safeData.description];

            toAppend += " <td></td>";
            tds.forEach(function(td){
                toAppend += "<td class='canEdit'>" + td + "</td>";
            });
            toAppend +=
                "<td>" +
                    '<img  style="cursor: hand;" class="doEdit" src="../../img/glyphicons/png/glyphicons_150_edit.png">    '+
                    '<img  style="cursor: hand;" class="removeRow" src="../../img/glyphicons/png/glyphicons_207_remove_2.png">'+
                "</td>";

            newRow = "<tr class='editRow'>" + toAppend + "</tr>";

            $lastRow.before(newRow);
            calcTotals($('#inOutMoneyTable'));
    });
}

/**
 * Enter in edition when we click on a row.
 * We also hide the add row for a better presentation.
 *
 * @param $theRow <tr> the edited row
 * @param $rowToHide <tr> the row to hide. Generally the add row.
 */
function editRow($theRow, $rowToHide) {
     /* Get the data from the rows we care. */
     editedIncome      =  $theRow.eq(0).find('td:eq(1)').html(),
     editedOutcome     =  $theRow.eq(0).find('td:eq(2)').html(),
     editedDescription =  $theRow.eq(0).find('td:eq(3)').html();

    //Mouhaha now you can't be re-edited
    $theRow.find('td').each (function() {
       $(this).removeClass('canEdit');
    });


     // We replace the text only row with a input so the user can modified his data.
    $theRow.eq(0).find('td:eq(0)').html('');
    $theRow.eq(0).find('td:eq(1)').html('<input style="width: 70px" class="form-control number" type="text" id="editIncome" name="editIncome" value="'+ editedIncome +'">');
    $theRow.eq(0).find('td:eq(2)').html('<input style="width: 70px" class="form-control number" type="text" id="editOutcome" name="editOutcome" value="'+ editedOutcome +'">');
    $theRow.eq(0).find('td:eq(3)').html('<input class="form-control" type="text" id="editDescription" name="editDescription" value="'+ editedDescription +'">');
    $theRow.eq(0).find('td:eq(4)').html('<img  style="cursor: hand;" class="saveEdit" src="../../img/glyphicons/png/glyphicons_446_floppy_save.png">    ' +
        '<img  style="cursor: hand;" class="revertEdit" src="../../img/glyphicons/png/glyphicons_197_remove.png">');

    $rowToHide.hide();
}

/**
 * Revert an edition.
 * We will put the old value, the new one can go to hell.
 *
 * @param $theRow <tr> the edited row
 * @param $rowToShow <tr> the row to show. Generally the add row.
 */
function revertEdit($theRow, $rowToShow) {
    $theRow.eq(0).find('td:eq(1)').html(editedIncome);
    $theRow.eq(0).find('td:eq(2)').html(editedOutcome);
    $theRow.eq(0).find('td:eq(3)').html(editedDescription);
    $theRow.eq(0).find('td:eq(4)').html('<img  style="cursor: hand;" class="doEdit" src="../../img/glyphicons/png/glyphicons_150_edit.png">    ' +
        '<img  style="cursor: hand;" class="removeRow" src="../../img/glyphicons/png/glyphicons_207_remove_2.png">');

    /** @type {number} */
    var uselessCtr = 0;

    $theRow.find('td').each (function() {
        uselessCtr++;

        //we don't want our td with the image and actions bind to them to have the class canEdit
        if (uselessCtr >=5) {
            return false;
        }
        //else you can edit that bad boy
        $(this).addClass('canEdit');
    });

    //Reset globals
    editedIncome,editedOutcome,editedDescription = "";

    $rowToShow.show();

    //recalculate totals
    calcTotals($('#inOutMoneyTable'));
}

/**
 * We "save" the new data, but before we sanitize his dirty strings.
 *
 * @param $theRow <tr> the edited row
 * @param $rowToShow <tr> the row to show. Generally the add row.
 */
function saveEdit($theRow, $rowToShow) {

    //Get the data the user provide.
    editedIncome      =  $theRow.eq(0).find('td:eq(1) :input').val(),
    editedOutcome     =  $theRow.eq(0).find('td:eq(2) :input').val(),
    editedDescription =  $theRow.eq(0).find('td:eq(3) :input').val();

    //Don't trust the user... sanitize these dirty strings.
    $.ajax({
        url: '/inoutmoney/sanitize_us',
        dataType: "json",
        data: JSON.stringify({ income: editedIncome, outcome: editedOutcome, description: editedDescription}),
        type: 'POST',
        contentType: 'application/json'
    })
    .done(function(safeData) {
        editedIncome      =  safeData.income,
        editedOutcome     =  safeData.outcome,
        editedDescription =  safeData.description;
        revertEdit($theRow, $rowToShow)
    });
}

/**
 * Calculate all the cash In/cash Out from the table.
 *
 * @param $table <table> the table we append the totals !
 */
function calcTotals($table) {
    var totIncome  = 0,
        totOutCome = 0,
        grandTotal = 0,
        comment    = '',
        styleCls   = '';

    //Loop into all the <tr> and get the data we want from them.
    $table.find('tr.editRow').each (function() {
        totIncome  = totIncome + parseFloat($(this).eq(0).find('td:eq(1)').html()),
        totOutCome = totOutCome + parseFloat($(this).eq(0).find('td:eq(2)').html());
    });

    var $lastRow = $table.find('tr:last');

    totIncome = parseFloat(Math.round(totIncome  * 100)/ 100);
    totOutCome = parseFloat(Math.round(totOutCome  * 100)/ 100);

    grandTotal = totIncome + (totOutCome * -1);

    // Add 2 digit But in the end it doesn't even matter
    $lastRow.eq(0).find('td:eq(1)').html(totIncome.toFixed(2));
    $lastRow.eq(0).find('td:eq(2)').html(totOutCome.toFixed(2));

    //Remove ALL THE CLASSES just in case... you know.
    $lastRow.removeClass('success danger warning');

    //Set the table footer styling
    if (grandTotal > 0 ) {
        comment  = '  <span class="label label-success"><b>bravo !</b></span>';
        styleCls = 'success';
    }
    else if (grandTotal < 0 ) {
        comment  = ' <span class="label label-danger"><b>il faudrait faire mieux !</b></span>';
        styleCls = 'danger';
    }
    else if (grandTotal == 0) {
        comment  = ' <span class="label label-warning"><b>Attention !!</b></span>';
        styleCls = 'warning';
    }

    $lastRow.eq(0).find('td:eq(3)').html("Grand Total : " + grandTotal.toFixed(2) + comment);
    $lastRow.addClass(styleCls);


}
