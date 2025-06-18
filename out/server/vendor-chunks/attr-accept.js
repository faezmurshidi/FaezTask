"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/attr-accept";
exports.ids = ["vendor-chunks/attr-accept"];
exports.modules = {

/***/ "(ssr)/./node_modules/attr-accept/dist/es/index.js":
/*!***************************************************!*\
  !*** ./node_modules/attr-accept/dist/es/index.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\n\nexports.__esModule = true;\n\nexports[\"default\"] = function (file, acceptedFiles) {\n  if (file && acceptedFiles) {\n    var acceptedFilesArray = Array.isArray(acceptedFiles) ? acceptedFiles : acceptedFiles.split(',');\n\n    if (acceptedFilesArray.length === 0) {\n      return true;\n    }\n\n    var fileName = file.name || '';\n    var mimeType = (file.type || '').toLowerCase();\n    var baseMimeType = mimeType.replace(/\\/.*$/, '');\n    return acceptedFilesArray.some(function (type) {\n      var validType = type.trim().toLowerCase();\n\n      if (validType.charAt(0) === '.') {\n        return fileName.toLowerCase().endsWith(validType);\n      } else if (validType.endsWith('/*')) {\n        // This is something like a image/* mime type\n        return baseMimeType === validType.replace(/\\/.*$/, '');\n      }\n\n      return mimeType === validType;\n    });\n  }\n\n  return true;\n};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYXR0ci1hY2NlcHQvZGlzdC9lcy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYixrQkFBa0I7O0FBRWxCLGtCQUFlO0FBQ2Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBIiwic291cmNlcyI6WyIvVXNlcnMvZmFlei9Eb2N1bWVudHMvRmFlelBNL25vZGVfbW9kdWxlcy9hdHRyLWFjY2VwdC9kaXN0L2VzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAoZmlsZSwgYWNjZXB0ZWRGaWxlcykge1xuICBpZiAoZmlsZSAmJiBhY2NlcHRlZEZpbGVzKSB7XG4gICAgdmFyIGFjY2VwdGVkRmlsZXNBcnJheSA9IEFycmF5LmlzQXJyYXkoYWNjZXB0ZWRGaWxlcykgPyBhY2NlcHRlZEZpbGVzIDogYWNjZXB0ZWRGaWxlcy5zcGxpdCgnLCcpO1xuXG4gICAgaWYgKGFjY2VwdGVkRmlsZXNBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGUubmFtZSB8fCAnJztcbiAgICB2YXIgbWltZVR5cGUgPSAoZmlsZS50eXBlIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBiYXNlTWltZVR5cGUgPSBtaW1lVHlwZS5yZXBsYWNlKC9cXC8uKiQvLCAnJyk7XG4gICAgcmV0dXJuIGFjY2VwdGVkRmlsZXNBcnJheS5zb21lKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICB2YXIgdmFsaWRUeXBlID0gdHlwZS50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKHZhbGlkVHlwZS5jaGFyQXQoMCkgPT09ICcuJykge1xuICAgICAgICByZXR1cm4gZmlsZU5hbWUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aCh2YWxpZFR5cGUpO1xuICAgICAgfSBlbHNlIGlmICh2YWxpZFR5cGUuZW5kc1dpdGgoJy8qJykpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBzb21ldGhpbmcgbGlrZSBhIGltYWdlLyogbWltZSB0eXBlXG4gICAgICAgIHJldHVybiBiYXNlTWltZVR5cGUgPT09IHZhbGlkVHlwZS5yZXBsYWNlKC9cXC8uKiQvLCAnJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtaW1lVHlwZSA9PT0gdmFsaWRUeXBlO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59OyJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/attr-accept/dist/es/index.js\n");

/***/ })

};
;