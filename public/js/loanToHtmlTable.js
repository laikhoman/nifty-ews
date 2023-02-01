'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
  'use strict';

/**
 * Create Loan Object with all instalments and sum of interest
 * @param {Loan}    loan     loan object
 * @param {object}  params   params
 *
 * @return {string}       html string with table
 */
function loanToHtmlTable (loan, params) {
  params = params || {}
  params.formatMoney = params.formatMoney || function (num) {
    return num.toFixed(2)
  }
  var fm = params.formatMoney
  var trans = function (key) {
    if (params.translations && params.translations[key]) {
      return params.translations[key]
    } else {
      return key
    }
  }
  var html = [
    '<table class="table designtable">' +
      '<thead class="headcolor">' +
        '<tr>' +
          '<th>No</th>' +
          '<th>' + trans('Capital') + '</th>' +
          '<th>' + trans('Interest') + '</th>' +
          '<th>' + trans('Installment') + '</th>' +
          '<th>' + trans('Remain') + '</th>' +
          '<th>' + trans('Interest sum') + '</th>' +
          '<th>' + trans('Status') + '</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>',
    '', // body content [1]
    '</tbody>' +
    '</table>'
  ]

  for (var i = 0; i < loan.installments.length; i++) {
    var inst = loan.installments[i]
    var instHtml =
		'<tr class="colortr">' +
            '<td class="bordertop">' + (i + 1) + '</td>' +
            '<td class="bordertop">' + fm(inst.capital) + '</td>' +
            '<td class="bordertop">' + fm(inst.interest) + '</td>' +
            '<td class="bordertop">' + fm(inst.installment) + '</td>' +
            '<td class="bordertop">' + fm(inst.remain) + '</td>' +
            '<td class="bordertop">' + fm(inst.interestSum) + '</td>' +
            '<td class="bordertop">' + "Pending" + '</td>' +
          '</tr>'
    html[1] += instHtml
  }
  html[1] +=
    '<tr class="colortr font-weight-bold"">' +
      '<td>' + trans('Sum') + '</td>' +
      '<td>' + fm(loan.capitalSum) + '</td>' +
      '<td>' + fm(loan.interestSum) + '</td>' +
      '<td>' + fm(loan.sum) + '</td>' +
      '<td>-</td>' +
      '<td>-</td>' +
      '<td>-</td>' +
    '</tr>'

  return html.join('')
}

/* istanbul ignore next */
if (typeof module === 'undefined') {
  // browser
  if (typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.loanToHtmlTable = loanToHtmlTable // eslint-disable-line no-undef
  } else {
    if (!window.LoanJS) {
      window.LoanJS = {}
    }
    window.LoanJS.loanToHtmlTable = loanToHtmlTable
  }
} else {
  // node or browserfy
  module.exports = loanToHtmlTable
}


})();