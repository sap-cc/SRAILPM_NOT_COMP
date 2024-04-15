sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/model/Filter"
], function(MessageToast, Filter) {
    'use strict';

    return {

        onInit: function () {
            //console.log("onInit ListReportExt.controller")
        },


        onBeforeRebindTableExtension: function (oEvent) {
            //console.log("onBeforeRebindTableExtension")
            // Set NotificationType as default filter (not needed anymore)
            //let oBindingParams = oEvent.getParameter("bindingParams");
            //oBindingParams.filters.push(new Filter("NotificationType", "EQ", "ZA")); 

        },
        
        onInitSmartFilterBarExtension: function (oEvent) {
            //console.log("onInitSmartFilterBarExtension")
        }



    };
});