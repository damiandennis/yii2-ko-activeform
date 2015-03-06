/**
 * Created by damian on 28/01/15.
 */
require.config({
    baseUrl: "/admin/js",
    packages: [
        "models/BaseModel.js",
        "models/BookingModel.js",
        "models/UserModel.js"
    ],
    waitSeconds: 15
});
require(["models/Model", "models/BaseModel", "models/BookingModel", "models/UserModel"], function(someModule) {

});