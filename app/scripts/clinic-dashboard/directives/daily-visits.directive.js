/* global angular */
/*
 jshint -W003, -W026
 */
(function () {
    'use strict';

    angular
            .module('app.clinicDashboard')
            .directive('dailyVisits', appointmentSchedule);

    function appointmentSchedule() {
        return {
            restict: 'E',
            scope: {
                locationUuid: '@',
            },
            controller: appointmentScheduleController,
            link: appointmentScheduleLink,
            templateUrl: 'views/clinic-dashboard/daily-visits.html',
        };
    }

    appointmentScheduleController.$inject = ['$scope', '$rootScope', 'EtlRestService',
        'AppointmentScheduleModel', 'moment', '$state', '$filter', 'ClinicDashboardService', 'OpenmrsRestService', ];

    function appointmentScheduleController($scope, $rootScope, EtlRestService,
            AppointmentScheduleModel, moment, $state, $filter, ClinicDashboardService, OpenmrsRestService) {

        //scope members region
        $scope.visitPatients = [];
        $scope.appointmentPatients = [];
        $scope.searchString = '';
        $scope.visitSearchString = '';
        $scope.appointmentSearchString = '';
        $scope.visitsNotReturned = ''
        $scope.isBusy = false;
        $scope.isBusyVisits = false;
        $scope.experiencedLoadingError = false;
        $scope.experiencedVisitsLoadingError = false;
        $scope.currentPage = 1;
        $scope.loadSchedule = loadSchedule;
        $scope.loadPatient = loadPatient;
        $scope.$on('viewDayAppointments', onViewDayAppointmentBroadcast);
        $scope.$on('viewDayNotReturnedAppointments', onViewDayNotReturnedAppointmentBroadcast);
        $scope.utcDateToLocal = utcDateToLocal;
        $scope.startDate = ClinicDashboardService.getStartDate();
        $scope.showVisits = false;
        $scope.showAppointments = true;
        $scope.showNoreturn = false;
        $scope.currentView = 'Appointments';
        $scope.toggleAppointmentVisits = toggleAppointmentVisits;
        $scope.selectAppointmentVisits = selectAppointmentVisits;

        $scope.selectedDate = function (value) {
            if (value) {
                $scope.startDate = value;
                ClinicDashboardService.setStartDate(value);
                loadSchedule();
            } else {
                return $scope.startDate;
            }
        };

        $scope.selectedDateAndState = function (value, scheduleState)
        {
            if (value) {
                $scope.startDate = value;
                ClinicDashboardService.setStartDate(value);
                loadScheduleOfState(scheduleState);
            } else {
                return $scope.startDate;
            }
        };

        $scope.openDatePopup = openDatePopup;
        $scope.dateControlStatus = {
            startOpened: false,
        };
        $scope.navigateDay = function (value) {
            if (value) {
                $scope.selectedDate(new Date($scope.startDate).addDays(value));
                var selectedDateField = document.getElementById('start-date');
                var element = angular.element(selectedDateField);
                element.val($filter('date')($scope.startDate, 'mediumDate'));
                element.triggerHandler('input');
            }
        };

        //end scope members region

        function toggleAppointmentVisits() {
            if ($scope.showAppointments) {
                $scope.showAppointments = false;
                $scope.showVisits = true;
            } else {
                $scope.showVisits = false;
                $scope.showAppointments = true;
            }
        }
        //select  the  type of  view  you  want to see
        function selectAppointmentVisits(viewType) {
            switch (viewType) {
                case "visits":
                {
                    $scope.currentView = 'Visit';
                    $scope.showNoreturn = false;
                    $scope.showAppointments = false;
                    $scope.showVisits = true;
                    break;
                }
                case "appointments":
                {
                    $scope.currentView = 'Appointments';
                    $scope.showNoreturn = false;
                    $scope.showVisits = false;
                    $scope.showAppointments = true;
                    break;
                }
                case "noreturn":
                {
                    $scope.currentView = 'Not Returned';
                    $scope.showNoreturn = true;
                    $scope.showVisits = false;
                    $scope.showAppointments = false;
                    break;
                }
//default  will resolve  to  visits  view
                default:
                {
                    $scope.showNoreturn = false;
                    $scope.showAppointments = false;
                    $scope.showVisits = true;
                    break;

                }
            }
        }

        function onViewDayAppointmentBroadcast(event, arg) {
            $scope.selectedDate(arg);
        }
        function onViewDayNotReturnedAppointmentBroadcast(event, arg) {
            $scope.selectedDateAndState(arg, 'not_returned');
        }

        function openDatePopup($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.dateControlStatus.startOpened = true;
        }
        ;

        function utcDateToLocal(date) {
            var day = new moment(date).format();
            return day;
        }
        function resetPaging(type) {
          $scope.nextStartIndex = 0;
          $scope.allDataLoaded = false;
          switch (type) {
            case 'not-returned':
            {
              //Pagination Params 4 getDailyNotReturnedVisits
              $scope.dailyNotReturnedVisitsNextIndex = 0;
              $scope.allDataLoaded4DailyNotReturnedVisits = false;
              $scope.notReturnedVisitPatients = [];
              break;
            }
            case 'attended':
            {
              //Pagination Params 4 Daily Visits
              $scope.dailyVisitsNextIndex = 0;
              $scope.allDataLoaded4DailyVisits = false;
              $scope.visitPatients = [];
              break;
            }
            case 'appointments':
            {
              //Pagination Params 4 getAppointmentSchedule
              $scope.appointmentScheduleNextIndex = 0;
              $scope.allDataLoaded4AppointmentSchedule = false;
              $scope.appointmentPatients = [];
              break;

            }
          }
        }
        function loadPatient(patientUuid) {
            /*
             Get the selected patient and save the details in the root scope
             so that we don't do another round trip to get the patient details
             */
            OpenmrsRestService.getPatientService().getPatientByUuid({uuid: patientUuid},
            function (data) {
                $rootScope.broadcastPatient = data;
                $state.go('patient', {uuid: patientUuid});
            }

            );
        }
        //Pagination Params 4 Daily Visits
        $scope.dailyVisitsNextIndex = 0;
        $scope.allDataLoaded4DailyVisits = false;

        //Pagination Params 4 getAppointmentSchedule
        $scope.appointmentScheduleNextIndex = 0;
        $scope.allDataLoaded4AppointmentSchedule = false;

        //Pagination Params 4 getDailyNotReturnedVisits
        $scope.dailyNotReturnedVisitsNextIndex = 0;
        $scope.allDataLoaded4DailyNotReturnedVisits = false;
        function loadSchedule(loadNextOffset) {

            if ($scope.isBusy === true || $scope.isBusyVisits)
                return;
            $scope.isBusy = true;
            $scope.isBusyVisits = true;
            if(loadNextOffset!==true)resetPaging('attended');
            if(loadNextOffset!==true)resetPaging('appointments');
            if(loadNextOffset!==true)resetPaging('not-returned');
            $scope.experiencedLoadingError = false;
            $scope.experiencedVisitsLoadingError = false;

            if ($scope.locationUuid && $scope.locationUuid !== '') {
                //Fetch Daily visits
                EtlRestService.getDailyVisits($scope.locationUuid,
                        moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        onFetchDailyVisitsSuccess, onFetchDailyVisitsFailed, $scope.dailyVisitsNextIndex, 300);

                //Fetch daily appointments
                EtlRestService.getAppointmentSchedule($scope.locationUuid,
                        moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        onFetchAppointmentsScheduleSuccess, onFetchAppointmentScheduleFailed, $scope.appointmentScheduleNextIndex, 300);

                //Fetch Daily not  returned patients.as
                EtlRestService.getDailyNotReturnedVisits($scope.locationUuid,
                        moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                        onFetchDailyNotReturnedVisitsSuccess, onFetchDailyNotReturnedVisitsFailed, $scope.dailyNotReturnedVisitsNextIndex, 300);

            }

        }
//Fetch schedule of a  given  state{states->{not-returned,attended,}}
        function loadScheduleOfState(scheduleOfState) {

            if ($scope.isBusy === true || $scope.isBusyVisits)
                return;
            $scope.isBusy = true;
            $scope.isBusyVisits = true;
            resetPaging('attended');
            resetPaging('appointments');
            resetPaging('not-returned');
            $scope.experiencedLoadingError = false;
            $scope.experiencedVisitsLoadingError = false;

            if ($scope.locationUuid && $scope.locationUuid !== '') {
                //Fetch the list of the users did  not  return
                //fetch  specific state
                switch (scheduleOfState) {
                    case 'not-returned':
                    {
                        EtlRestService.getDailyNotReturnedVisits($scope.locationUuid,
                                moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                                moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                                onFetchDailyNotReturnedVisitsSuccess, onFetchDailyNotReturnedVisitsFailed,
                                $scope.dailyNotReturnedVisitsNextIndex, 300);
                        break;
                    }
                    case 'attended':
                    {
                        EtlRestService.getDailyVisits($scope.locationUuid,
                                moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                                moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ',
                                  $scope.dailyVisitsNextIndex, 300),
                                onFetchDailyVisitsSuccess, onFetchDailyVisitsFailed);
                        break;
                    }
                    case 'appointments':
                    {
                        EtlRestService.getAppointmentSchedule($scope.locationUuid,
                                moment($scope.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                                moment($scope.startDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                                onFetchAppointmentsScheduleSuccess, onFetchAppointmentScheduleFailed,
                                $scope.appointmentScheduleNextIndex, 300);
                        break;
                    }
                }


            }

        }




        function onFetchAppointmentsScheduleSuccess(appointmentSchedule) {
          $scope.appointmentScheduleNextIndex +=  appointmentSchedule.size;

          if (appointmentSchedule.size === 0){
            $scope.allDataLoaded4AppointmentSchedule = true;
          }else{
            for (var e in appointmentSchedule.result) {
              if($scope.appointmentPatients.length!=0){
                $scope.appointmentPatients.push.apply($scope.appointmentPatients,
                  new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]))

              } else {
                $scope.appointmentPatients.push(new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]));
              }

            }
          }

            $scope.customAppointmentPatients = [];
            _.each($scope.appointmentPatients, function (patient)
            {
                var singlePatient = {
                    uuid: patient.uuid(),
                    identifier: patient.identifiers(),
                    name: patient.givenName() + ' ' + patient.familyName() + ' ' + patient.middleName(),
                    rtc_date: patient.rtc_date(),
                    status: Math.round(Math.abs((patient.rtc_date()) - (patient.next_encounter_datetime())) / 8.64e7) <= 7,
                };
                console.log('Use (rtc_date - next_encounter_datetime) to determine if the row should be highlighted:', singlePatient.status);
                $scope.customAppointmentPatients.push(singlePatient);

            });

            $scope.isBusy = false;
        }

        function onFetchAppointmentScheduleFailed(error) {
            $scope.experiencedLoadingError = true;
            $scope.isBusy = false;
        }

        function onFetchDailyVisitsSuccess(appointmentSchedule) {
          $scope.dailyVisitsNextIndex +=  appointmentSchedule.size;
          if (appointmentSchedule.size === 0){
            $scope.allDataLoaded4DailyVisits = true;
          }else{
            for (var e in appointmentSchedule.result) {
              if($scope.visitPatients.length!=0){
                $scope.visitPatients.push.apply($scope.visitPatients,
                  new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]))

              } else {
                $scope.visitPatients.push(new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]));
              }

            }
          }

            $scope.customPatients = [];
            _.each($scope.visitPatients, function (patient)
            {
                var singlePatient = {
                    uuid: patient.uuid(),
                    identifier: patient.identifiers(),
                    name: patient.givenName() + ' ' + patient.familyName() + ' ' + patient.middleName(),
                    rtc_date: patient.rtc_date(),
                    status: Math.round(Math.abs((patient.rtc_date()) - (patient.next_encounter_datetime())) / 8.64e7) <= 7
                };
                console.log('Use (rtc_date - next_encounter_datetime) to determine if the row should be highlighted:', singlePatient.status);
                $scope.customPatients.push(singlePatient);

            });

            $scope.isBusyVisits = false;
        }

        function onFetchDailyVisitsFailed(error) {
            $scope.experiencedVisitsLoadingError = true;
            $scope.isBusyVisits = false;
        }
        //Daily not returned visits Block
        function onFetchDailyNotReturnedVisitsSuccess(appointmentSchedule) {
            console.log('No return  visits  retuned success' + appointmentSchedule);
            $scope.dailyNotReturnedVisitsNextIndex +=  appointmentSchedule.size;
            if (appointmentSchedule.size === 0){
              $scope.allDataLoaded4DailyNotReturnedVisits = true;
            }else{
              for (var e in appointmentSchedule.result) {
                if($scope.notReturnedVisitPatients.length!=0){
                  $scope.notReturnedVisitPatients.push.apply($scope.notReturnedVisitPatients,
                    new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]))
                } else {
                  $scope.notReturnedVisitPatients.push(new AppointmentScheduleModel.appointmentSchedule(appointmentSchedule.result[e]));
                }

              }
            }
            $scope.customPatientsNotReturned = [];
            _.each($scope.notReturnedVisitPatients, function (patient)
            {
                var singlePatient = {
                    uuid: patient.uuid(),
                    identifier: patient.identifiers(),
                    name: patient.givenName() + ' ' + patient.familyName() + ' ' + patient.middleName(),
                    rtc_date: patient.rtc_date(),
                    status: Math.round(Math.abs((patient.rtc_date()) - (patient.next_encounter_datetime())) / 8.64e7) <= 7
                };
                // console.log('Use (rtc_date - next_encounter_datetime) to determine if the row should be highlighted:', singlePatient.status);
                $scope.customPatientsNotReturned.push(singlePatient);

            });

            $scope.isBusyVisits = false;
        }

        function onFetchDailyNotReturnedVisitsFailed(error) {
            $scope.experiencedVisitsLoadingError = true;
            $scope.isBusyVisits = false;
        }

    }

    function appointmentScheduleLink(scope, element, attrs, vm) {
        attrs.$observe('locationUuid', onLocationUuidChanged);

        function onLocationUuidChanged(newVal, oldVal) {
            if (newVal && newVal != '') {
                scope.isBusy = false;
                scope.visitPatients = [];
                scope.appointmentPatients = [];
                scope.loadSchedule();
            }
            ;
        }
    }
})();
