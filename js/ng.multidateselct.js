;(function (angular) {
    var indexOf = [].indexOf || function (item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i;
            }
            return -1;
        };

    angular.module('ng.multidateselect', [])

        .directive('multiDateSelect', ['$locale', '$filter', function ($locale, $filter) {
            return {
                require: 'ngModel',
                scope: {
                    date: '=ngModel',
                    minDate: '=',
                    maxDate: '=',
                    disabledDates: '=',
                    maxLimit: '=',
                    startingDay: '='
                },
                templateUrl: './tpl/datepicker.html',

                link: function (scope, element, attrs, ngModel) {
                    var minDate = scope.minDate && stringToDate(scope.minDate),
                        maxDate = scope.maxDate && stringToDate(scope.maxDate),
                        disabledDates = scope.disabledDates || [],
                        currentDate = new Date(),
                        maxLimit = parseInt(scope.maxLimit),
                        startingDay = scope.startingDay || 0,
                        today = $filter('date')(new Date(), 'yyyy-MM-dd');

                    var months = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];

                    scope.date = (typeof scope.date == 'undefined' && maxLimit != 1) ? [] : scope.date;
                    scope.isSelected = function (d) {
                        if (maxLimit != 1) {
                            var flag = 0;
                            angular.forEach(scope.date, function (dt) {
                                if (d == dt) flag = 1;
                            });
                            return flag ? true : false;
                        } else {
                            return (d == scope.date);
                        }
                    };

                    function canAddDate(){
                        return (maxLimit == 0 || angular.isArray(scope.date) && maxLimit > scope.date.length);
                    }

                    function getDates(startDate, n) {
                        var dates = new Array(n);
                        var current = startDate, i = 0;
                        while (i < n) {
                            dates[i++] = new Date(current);
                            current.setDate(current.getDate() + 1);
                        }
                        return dates;
                    }

                    function split(arr, size) {
                        var arrays = [];
                        while (arr.length > 0) {
                            arrays.push(arr.splice(0, size));
                        }
                        return arrays;
                    }

                    function stringToDate(dateString) {
                        if (angular.isArray(dateString)) dateString = dateString[0];
                        if (angular.isDate(dateString)) return new Date(dateString);
                        var dateParts = dateString.split('-'),
                            year = dateParts[0],
                            month = dateParts[1],
                            day = dateParts[2];

                        // set hour to 3am to easily avoid DST change
                        return new Date(year, month - 1, day, 3);
                    }

                    function makeDate(date, format, isSecondary) {
                        return {
                            date: date,
                            label: $filter('date')(date, format),
                            className: getClass(date, isSecondary)
                        };
                    }

                    function getClass(date, isSecondary) {

                        var className = "";

                        if (date < scope.minDate || date > scope.maxDate) {
                            className = 'dp-disabled';
                        } else if (isSecondary) {
                            className += 'dp-secondary hand';
                        } else if (indexOf.call(disabledDates, date) >= 0) {
                            className = 'dp-disabled dp-unavailable';
                        } else {
                            className = 'dp-enabled hand';
                        }

                        if (date === today) {
                            className += ' dp-today';
                        }

                        return className;
                    }

                    scope.render = function (initialDate) {

                        initialDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 3);

                        var year = initialDate.getFullYear(), month = initialDate.getMonth(),
                            firstDayOfMonth = new Date(year, month, 1);
                        var difference = startingDay - firstDayOfMonth.getDay(),
                            numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : -difference,
                            firstDate = new Date(firstDayOfMonth), numDates = 0;

                        if (numDisplayedFromPreviousMonth > 0) {
                            firstDate.setDate(-numDisplayedFromPreviousMonth + 1);
                            numDates += numDisplayedFromPreviousMonth; // Previous
                        }
                        numDates += new Date(year, month + 1, 0).getDate(); // Current
                        numDates += (7 - numDates % 7) % 7; // Next

                        var days = getDates(firstDate, numDates), labels = new Array(7);

                        for (var i = 0; i < numDates; i++) {
                            var dt = new Date(days[i]);
                            days[i] = makeDate($filter('date')(dt, 'yyyy-MM-dd'), 'd', dt.getMonth() !== month);
                        }
                        for (var j = 0; j < 7; j++) {
                            labels[j] = {
                                day: $filter('date')(days[j].date, 'EEE'),
                                dow: new Date(days[j].date).getDay()
                            };
                        }


                        var nextMonthInitialDate = new Date(initialDate);
                        nextMonthInitialDate.setMonth(month + 1);

                        scope.allowPrevMonth = !minDate || initialDate > minDate;
                        scope.allowNextMonth = !maxDate || nextMonthInitialDate < maxDate;

                        scope.labels = labels;
                        scope.dates = days;
                        scope.rows = split(days, 7);
                        scope.curMonth = months[initialDate.getMonth()];
                        scope.curYear = initialDate.getFullYear();
                    };

                    scope.setDate = function (dateObj) {
                        if (isDateDisabled(dateObj) || angular.equals({}, dateObj)) return;
                        if (maxLimit != 1 && !angular.isArray(scope.date)) scope.date = [];

                        if (canAddDate() && indexOf.call(scope.date, dateObj.date) == -1)
                            scope.date.push(dateObj.date);
                        else if (maxLimit == 1)
                            ngModel.$setViewValue(dateObj.date);
                        else {
                            var position = indexOf.call(scope.date, dateObj.date);
                            if(position != -1) scope.date.splice(position, 1);
                        }
                    };

                    ngModel.$render = function () {
                        if ((!angular.isArray(ngModel.$modelValue))
                            && (scope.date = ngModel.$modelValue) && (indexOf.call(disabledDates, scope.date) === -1)) {
                            scope.currentDate = currentDate = stringToDate(scope.date);
                        } else if (scope.date) {
                            // if the initial date set by the user is in the disabled dates list, unset it
                            scope.setDate({});
                        }
                        scope.render(currentDate);
                    };

                    scope.changeMonth = function (offset) {
                        // If the current date is January 31th, setting the month to date.getMonth() + 1
                        // sets the date to March the 3rd, since the date object adds 30 days to the current
                        // date. Settings the date to the 2nd day of the month is a workaround to prevent this
                        // behaviour
                        currentDate.setDate(1);
                        currentDate.setMonth(currentDate.getMonth() + offset);
                        scope.render(currentDate);
                    };


                    function isDateDisabled(dateObj) {
                        return (/dp-disabled/.test(dateObj.className));
                    }

                    scope.addDates = function (dts) {
                        if (maxLimit == 1  || !angular.isArray(dts)) return;
                        if (!angular.isArray(scope.date)) scope.date = [];
                        angular.forEach(dts, function (date) {
                            if (canAddDate() && indexOf.call(scope.date, date) == -1) scope.date.push(date);
                        });
                    };

                    scope.removeDates = function (dts) {
                        if (maxLimit == 1 || !angular.isArray(dts)) return;
                        if (!angular.isArray(scope.date)) scope.date = [];
                        angular.forEach(dts, function (date) {
                            var position = indexOf.call(scope.date, date);
                            if (position != -1)
                                scope.date.splice(position, 1);
                        });
                    };

                    scope.firstDow = minDate.getDay();
                    scope.isSelectedDayOfWeek = function (dow) {

                        if (maxLimit != 0) return;

                        var min = angular.copy(minDate);
                        var diffDate = dow > scope.firstDow ? dow - scope.firstDow : 7 - (scope.firstDow - dow);
                        var firstDay = (scope.firstDow == dow) ? min :
                            new Date(min.setDate(min.getDate() + diffDate));

                        while (firstDay <= maxDate) {
                            if (indexOf.call(scope.date, $filter('date')(firstDay, 'yyyy-MM-dd')) == -1) return false;
                            var newDate = firstDay.setDate(firstDay.getDate() + 7);
                            firstDay = new Date(newDate);
                        }

                        return true;
                    };

                    scope.toggleDayOfWeek = function (dow, active) {

                        if (maxLimit != 0) return;

                        var min = angular.copy(minDate);
                        var diffDate = dow > scope.firstDow ? dow - scope.firstDow : 7 - (scope.firstDow - dow);
                        var firstDay = (scope.firstDow == dow) ? min :
                            new Date(min.setDate(min.getDate() + diffDate));

                        var dts = [];
                        while (firstDay <= maxDate) {
                            dts.push($filter('date')(firstDay, 'yyyy-MM-dd'));
                            firstDay = new Date(firstDay.setDate(firstDay.getDate() + 7));
                        }

                        if (active) {
                            scope.removeDates(dts);
                        } else {
                            scope.addDates(dts);
                        }

                    };
                }
            };
        }]);
})(window.angular);