# ng.multidateselect

Angular MultiDateSelect directive

With this datepicker you will be able to select several dates from dynamic calendar. 
It's possible to pick up all Mondays, Tuesdays, etc. of a month by clicking on day name (it currently works with unlimited maxLimit only).

See example.html

![screenshot](http://2no.co/2Bdz.gif)

## Install

1. Download js & css folders and insert it to your project

2. Insert this lines in your HTML code:

    ```    
    <script src="js/ng.multidateselct.js"></script>
    <link rel="stylesheet" href="css/datepicker.css">
    ```

3. add module dependency to your App:

    ```
    angular.module('myApp', ['ng.multidateselect'])
    ```

4. then you can use directive:

    ```
    <div multi-date-select
             ng-model="date"
             min-date="minDate" 
             max-date="maxDate" 
             max-limit="0" <!-- 0 - unlimited, 1,2,3, etc. - select certain number of dates -->
             starting-day="1"></div> <!--  1 - Monday, 0 - Sunday -->
    ```