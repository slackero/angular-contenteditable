/**
 * @see http://docs.angularjs.org/guide/concepts
 * @see http://docs.angularjs.org/api/ng.directive:ngModel.NgModelController
 * @see https://github.com/angular/angular.js/issues/528#issuecomment-7573166
 */
(function(window, angular, undefined) {'use strict';

angular.module('contenteditable', [])
  .directive('contenteditable', ['$timeout', function($timeout) { return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {
      // don't do anything unless this is actually bound to a model
      if (!ngModel) {
        return
      }

      // options
      var opts = {}
      angular.forEach([
        'stripBr',
        'noLineBreaks',
        'selectNonEditable',
        'moveCaretToEndOnChange',
        'stripTags',
        'numbersOnly',
        'textOnly',
        'brLineBreaksOnly'
      ], function(opt) {
        var o = attrs[opt]
        opts[opt] = o && o !== 'false'
      })

      // view -> model
      element.bind('input', function(e) {
        scope.$apply(function() {
          var html, html2, rerender = false
          if (opts.textOnly) {
            html = element.text()
            html2 = (!opts.stripBr && !opts.noLineBreaks) ? html.replace(/\n/g, '<br>') : html.replace(/\n/g, ' ').trim()
          } else {
            html = element.html()
            if (opts.brLineBreaksOnly) {
              opts.noLineBreaks = false
              opts.stripBr = false
              opts.stripTags = false
              html2 = html.replace(/<div>/g, '\n').replace(/<br>/g, '\n').replace(/<\/div>/g, '').replace(/<\S[^><]*>/g, '').replace(/\n/g, '<br>')
            }
            if (opts.stripBr) {
              html2 = html.replace(/<br>$/, '')
            }
            if (opts.noLineBreaks) {
              html2 = html.replace(/<div>/g, '').replace(/<br>/g, '').replace(/<\/div>/g, '')
            }
            if (opts.stripTags) {
              html2 = html.replace(/<\S[^><]*>/g, '')
            }
          }
          if (opts.numbersOnly) {
            html2 = html.replace(/\D/g, '');
          }
          if (html2 !== html) {
            rerender = true
            html = html2
          }
          ngModel.$setViewValue(html)
          if (rerender) {
            ngModel.$render()
          }
          if (html === '') {
            // the cursor disappears if the contents is empty
            // so we need to refocus
            $timeout(function(){
              element[0].blur()
              element[0].focus()
            })
          }
        })
      })

      // model -> view
      var oldRender = ngModel.$render
      ngModel.$render = function() {
        var el, el2, range, sel
        if (!!oldRender) {
          oldRender()
        }
        var html = ngModel.$viewValue || ''
        if (opts.stripTags) {
          html = html.replace(/<\S[^><]*>/g, '')
        }

        element.html(html)
        if (opts.moveCaretToEndOnChange) {
          el = element[0]
          range = document.createRange()
          sel = window.getSelection()
          if (el.childNodes.length > 0) {
            el2 = el.childNodes[el.childNodes.length - 1]
            range.setStartAfter(el2)
          } else {
            range.setStartAfter(el)
          }
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
      if (opts.selectNonEditable) {
        element.bind('click', function(e) {
          var range, sel, target
          target = e.toElement
          if (target !== this && angular.element(target).attr('contenteditable') === 'false') {
            range = document.createRange()
            sel = window.getSelection()
            range.setStartBefore(target)
            range.setEndAfter(target)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        })
      }
    }
  }}]);

}(window, window.angular));
