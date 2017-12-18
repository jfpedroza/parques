/// <reference path="../../../../node_modules/@types/angular/index.d.ts" />
/// <reference path="../../../../node_modules/@types/angular-route/index.d.ts" />

declare const angular: ng.IAngularStatic;

angular.module('ParquesAdmin', ['ngRoute', 'btford.socket-io']);

import "./app.route";
import "./controllers/IndexController";
import "./controllers/LoginController";
import "./services/SocketService";