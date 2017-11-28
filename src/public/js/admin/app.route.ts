/// <reference path="../../../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../../../node_modules/@types/angular-route/index.d.ts" />

namespace ParquesAdmin {

    const routes = ($routeProvider: ng.route.IRouteProvider) => {
        $routeProvider.when('/', {
            templateUrl: 'js/admin/views/index.html',
            controller: 'IndexController'
        }).when('/login', {
            templateUrl: 'js/admin/views/login.html',
            controller: 'LoginController'
        }).otherwise({
            redirectTo: '/'
        });
    };

    routes.$inject = ['$routeProvider'];

    angular.module('ParquesAdmin').config(routes);
}