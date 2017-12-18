/// <reference path="../../../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../../../node_modules/@types/angular-route/index.d.ts" />

const routes = ($routeProvider: ng.route.IRouteProvider) => {
    $routeProvider.when('/', {
        templateUrl: 'js/admin/views/index.html',
        controller: 'IndexController',
        controllerAs: 'ctrl'
    }).when('/login', {
        templateUrl: 'js/admin/views/login.html',
        controller: 'LoginController',
        controllerAs: 'ctrl'
    }).otherwise({
        redirectTo: '/'
    });
};

routes.$inject = ['$routeProvider'];

angular.module('ParquesAdmin').config(routes);