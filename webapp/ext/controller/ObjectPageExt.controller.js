sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function(MessageToast, DateFormat, Fragment) {
    'use strict';

    return {

        onInit: function () {
            let oExtensionApi = this.extensionAPI;
            oExtensionApi.attachPageDataLoaded(function (oEvent) {
                this._onPageDataLoaded(oEvent)
            }.bind(this));

            // Button styles
            let oSaveButton = this.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::saveButton");
            oSaveButton.setType(sap.m.ButtonType.Accept);
            let oCancelButton = this.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::cancelButton");
            oCancelButton.setType(sap.m.ButtonType.Reject);
            let oCreateWarrantyButton = this.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::createWarrantyButton");
            oCreateWarrantyButton.setType(sap.m.ButtonType.Emphasized);

            let oJsonModel = new sap.ui.model.json.JSONModel();
            let oModel = {
                isEnabled: false,
                userStatus: "",
                malBeg: "",
                malEnd: "",
                malCode: "",
                partyCode: "",
                train: "",
                delay: ""
            };
            oJsonModel.setData(oModel);
            this.getView().setModel(oJsonModel, "originvaluesModel");
        },

        /**
         * save changes for this notification
         * @param {*} oEvent 
         */
        save: function (oEvent) {
            let that = this;
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            let oObject = oEvent.getSource().getBindingContext().getObject();
            // collect data
            let sUserStatus = this.getView().byId("selUserStatNew").getSelectedKey();
            /** @todo UserStatus = "" -> Aktueller UserStatus? */
            
            let oMalbegDate = this._dateToUTC(this.getView().byId("dtMalBeg").getDateValue());
            let oMalendDate = this._dateToUTC(this.getView().byId("dtMalEnd").getDateValue());
            /** @todo kein Datum gewollt = "" -> ??? */

            //let oMalbegTime = this.getView().byId("timeMalBegin").getValue();
            let oMalbegTime = this._timeFormatPT(this.getView().byId("timeMalBegin").getDateValue());
            let oMalendTime = this._timeFormatPT(this.getView().byId("timeMalEnd").getDateValue());

            let sResponsibleCode = this.getView().byId("selResponsible").getSelectedKey();
            let sMalfunctionCode = this.getView().byId("selMalfunction").getSelectedKey();

            let oTrain = this.getView().byId("inpTrain");
            let oDelay = this.getView().byId("inpDelay");
            let sTrain = (oTrain !== undefined ? oTrain.getValue() : "0");
            let sDelay = (oDelay !== undefined ? oDelay.getValue() : "0");
            let iTrain;
            let iDelay;

            // validation
            let bReturn = false;

            let sDateBeg = this.getView().byId("dtMalBeg").getValue();
            let sDateEnd = this.getView().byId("dtMalEnd").getValue();

            /**  @todo Datum Mussfeld ????? */
            if (oMalbegDate !== null) {
                if (sDateBeg.length < 10 && sDateBeg.length > -1) {
                    MessageToast.show(oI18n.getText("enterDate"));
                    this.getView().byId("dtMalBeg").setValueState("Error");
                    bReturn = true;
                }
            }

            /**  @todo Datum Mussfeld ????? */
            if (oMalendDate) {
                if (sDateEnd.length < 10 && sDateEnd.length > -1) {
                    MessageToast.show(oI18n.getText("enterDate"));
                    this.getView().byId("dtMalEnd").setValueState("Error");
                    bReturn = true;
                }
            }

            if (oTrain !== undefined) {
                if (sTrain.length < 1) {
                    iTrain = 0;
                    oTrain.setValueState("None");
                } else {
                    if (isNaN(sTrain)) {
                        MessageToast.show(oI18n.getText("enterNumber"));
                        oTrain.setValueState("Error");
                        bReturn = true;
                    } else {
                        iTrain = parseInt(sTrain);
                        oTrain.setValueState("None");
                    }
                }
            } else {
                iTrain = 0;
            }
            if (oDelay !== undefined) {
                if (sDelay.length < 1) {
                    iDelay = 0;
                    oDelay.setValueState("None");
                } else {
                    if (isNaN(sDelay)) {
                        MessageToast.show(oI18n.getText("enterNumber"));
                        oDelay.setValueState("Error");
                        bReturn = true;
                    } else {
                        iDelay = parseInt(sDelay);
                        oDelay.setValueState("None");
                    }
                }
            } else {
                iDelay = 0;
            }

            if (bReturn) {
                return;
            }

            // leading zeros
            let sNotification = oObject.MaintenanceNotification.padStart(12, "0");
            let oUrlParameters = {
                Maintenancenotification: sNotification,
                //MalfunctionBegin: oMalbegDate,
                //MalfunctionBeginTime: oMalbegTime,
                //MalfunctionEnd: oMalendDate,
                //MalfunctionEndTime: oMalendTime,
                MalfunctionCode: sMalfunctionCode,
                PartyCode: sResponsibleCode,
                Train: iTrain,
                UserStatus: sUserStatus,
                Delay: iDelay
            };
/**  @todo Datum / Zeit  Mussfeld ????? */
            if (oMalbegDate) {
                oUrlParameters.MalfunctionBegin = oMalbegDate;
            }
            if (oMalbegTime) {
                oUrlParameters.MalfunctionBeginTime = oMalbegTime;
            }
            if (oMalendDate) {
                oUrlParameters.MalfunctionEnd = oMalendDate;
            }
            if (oMalendTime) {
                oUrlParameters.MalfunctionEndTime = oMalendTime;
            }

            const oModel = this.getView().getModel();
            oModel.callFunction("/save_zg_notification", { 
                urlParameters: oUrlParameters, 
                method: "POST",
                success: function (oData, oResponse) {
                    let sMessage = "";
                    if (oData.Status === "S-OK") {
                        sMessage = oI18n.getText("dataSaved");
                        MessageToast.show(sMessage);
                        // load data
                        that._getData(oObject.MaintenanceNotification);
                        that._getViews(oObject.MaintenanceNotification);
                        
                    } else {
                        sMessage = oData.Message;
                        new sap.m.MessageBox.show(sMessage, {
                            title: oI18n.getText("dataNotSavedTitle"),
                            icon: sap.m.MessageBox.Icon.WARNING
                        });
                    }
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
            
        },

        /**
         * cancel changes/inputs
         * @param {*} oEvent 
         */
        cancel: function (oEvent) {
            let oOrigViews = this.getView().getModel("originvaluesModel").getData();
            let oUserStatusModel = this.getView().getModel("userstatusModel").getData();
            this.getView().byId("selUserStatNew").setSelectedKey(oUserStatusModel.languageSpecificStatus);
            this.getView().byId("dtMalBeg").setValue(this._getDate(oOrigViews.malBeg));
            this.getView().byId("timeMalBegin").setValue(this.formatDatewithPT(oOrigViews.malBegTime));
            this.getView().byId("dtMalEnd").setValue(this._getDate(oOrigViews.malEnd));
            this.getView().byId("timeMalEnd").setValue(this.formatDatewithPT(oOrigViews.malEndTime));
            this.getView().byId("selResponsible").setSelectedKey(oOrigViews.partyCode);
            this.getView().byId("selMalfunction").setSelectedKey(oOrigViews.malCode);
            let oTrain = this.getView().byId("inpTrain");
            let oDelay = this.getView().byId("inpDelay");
            if (oTrain !== undefined) {
                oTrain.setValue(oOrigViews.train)
            }
            if (oDelay !== undefined) {
                oDelay.setValue(oOrigViews.delay)
            }
        },

        /**
         * unlock notification
         * @param {*} oEvent 
         */
        unlock: function (oEvent) {
            let that = this;
            let oObject = oEvent.getSource().getBindingContext().getObject();
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            const oModel = this.getView().getModel();
            oModel.callFunction("/unlock_zg_notification", { 
                urlParameters: {
                    Maintenancenotification: oObject.MaintenanceNotification,
                }, 
                method: "POST",
                success: function (oData, oResponse) {
                    // load data
                    that._getData(oObject.MaintenanceNotification);
                    that._getViews(oObject.MaintenanceNotification);
                    // to do
                    MessageToast.show("Noch nicht implementiert. Antwort: " + oData.Status + " / " + oData.Maintenancenotification);
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
            
        },

        /**
         * create warranty notification
         * @param {*} oEvent 
         */
        createWarrantyNotification: function (oEvent) {
            let oObject = oEvent.getSource().getBindingContext().getObject();
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            const oModel = this.getView().getModel();
            oModel.callFunction("/create_zg_notification", { 
                urlParameters: {
                    Maintenancenotification: oObject.MaintenanceNotification,
                }, 
                method: "POST",
                success: function (oData, oResponse) {
                    let sMaintNot = oData.Maintenancenotification;
                    // Message
                    if (oData.Status === "C-OK") {
                        let sMessage = oI18n.getText("notificationCreatedMessage");
                        sMessage += "\n" + sMaintNot;
                        new sap.m.MessageBox.show(sMessage, {
                            title: oI18n.getText("notificationCreated"),
                            icon: sap.m.MessageBox.Icon.SUCCESS
                        });
                    } else {
                        let sMessage = oData.Message;
                        new sap.m.MessageBox.show(sMessage, {
                            title: oI18n.getText("notificationNotCreated"),
                            icon: sap.m.MessageBox.Icon.WARNING
                        });
                    }
                    
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
        },

        /**
         * get longtext
         * @param {*} oEvent 
         */
        getLongtext: function (oEvent) {
            let oObject = oEvent.getSource().getBindingContext().getObject();
            let sId = oEvent.getSource().getId();

            let oOpener = this.getView().byId(sId);
            
            if (sId.endsWith("btnNotifLong")) {
                let sLongtext = oObject.MaintNotificationLongText;
                this._openPopover(oOpener, sLongtext);
            } else {
                this._closePopover();
                let sName = oEvent.getSource().data("name");
                let sObject = oEvent.getSource().data("object");
                
                let sNotification = oObject.MaintenanceNotification;
                // leading zeros
                sNotification = sNotification.padStart(12, "0");
                let oUrlParameters = {
                    Maintenancenotification: sNotification,
                    Name: sName,
                    Object: sObject
                };
                if (sName) {
                    let that = this;
                    const oI18n = this.getView().getModel("i18n").getResourceBundle();
                    const oModel = this.getView().getModel();
                    
                    oModel.callFunction("/get_zg_longtext", { 
                        urlParameters: oUrlParameters, 
                        method: "POST",
                        success: function (oData, oResponse) {
                            if (oData.Longtextfield.length > 0) {
                                that._openPopover(oOpener, oData.Longtextfield);
                            } 
                        },
                        error: function (oError) {
                            let sMessage = oError.message + "\n" + oError.statusText;
                            new sap.m.MessageBox.show(sMessage, {
                                title: oI18n.getText("servererror"),
                                icon: sap.m.MessageBox.Icon.ERROR
                            });
                        }
                    });
                }
            
            }
        },


        /**
         * Formatter (date to string)
         * @param {*} oDate 
         * @returns 
         */
        getDateAsString: function (oDate) {
            if (oDate === undefined) {
                return "";
            } else if (oDate !== null) {
                let oDateFormat = DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy" });
                return oDateFormat.format(new Date(oDate));
            } else {
                return "";
            }
        },


        /**
         * Navigation to Object Page (event)
         * @param {*} oEvent 
         */
        _onPageDataLoaded: function (oEvent) {
            let sPath = oEvent.context.sPath;
            let oDataMain = oEvent.context.getModel().getProperty(sPath);
            this._getData(oDataMain.MaintenanceNotification);
            this._getViews(oDataMain.MaintenanceNotification);
        },

        /**
         * get data
         * @param {*} sNotification 
         */
        _getData: function (sNotification) {
            let that = this;
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            let aFilter = [
                new sap.ui.model.Filter("MaintenanceNotification", sap.ui.model.FilterOperator.EQ, sNotification)
            ];
            let sUrlParameters = "to_MaintenanceNotification/to_MaintenancePartner," +
                "to_MaintenanceNotification/to_MaintenanceNotificationItem," +
                "to_MaintenanceNotification/to_MaintNotificationActivity/to_MaintNotificationActivityCode," +
                "to_UserStatIs/to_UserStatToBe," + 
                "to_MaintenanceNotification/to_MaintenanceNotificationItem/to_MaintNotifDamageCodeGroup," +
                "to_MaintenanceNotification/to_MaintenanceNotificationItem/to_MaintNotificationDamageCode," +
                "to_MaintenanceNotification/to_MaintenanceNotificationItem/to_MaintenanceNotificationCause/to_MaintNotificationCauseCode," +
                "to_MaintenanceNotification/to_MaintenanceNotificationItem/to_MaintNotifObjPrtCode";
            const oModel = this.getView().getModel();
            oModel.read("/xSRAILxPM_NOTIFICATION", {
                filters: aFilter,
                urlParameters: {
                    "$expand": sUrlParameters
                },
                success: function (oData, oResponse) {
                    // User status: selection status is
                    if (oData.results[0].to_UserStatIs.results.length > 0) {
                        oData.results[0].to_UserStatIs.results[0].to_UserStatToBe.results.unshift({
                            languageSpecificStatusTobe: oData.results[0].to_UserStatIs.results[0].languageSpecificStatus,
                            technicalStatusDescriptionToBe: oData.results[0].to_UserStatIs.results[0].technicalStatusDescription}
                        );
                    }
                    /* User status: selection (start with empty key)
                    if (oData.results[0].to_UserStatIs.results.length > 0) {
                        oData.results[0].to_UserStatIs.results[0].to_UserStatToBe.results.unshift({
                            languageSpecificStatusTobe: "",
                            technicalStatusDescriptionToBe: ""}
                        );
                    }
                    */
                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData.results[0].to_UserStatIs.results[0]);
                    that.getView().setModel(oJsonModel, "userstatusModel");
                    // Partner
                    oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData.results[0].to_MaintenanceNotification.to_MaintenancePartner.results[0]);
                    that.getView().setModel(oJsonModel, "partnerModel");
                    // Notification
                    oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData.results[0].to_MaintenanceNotification);
                    that.getView().setModel(oJsonModel, "notifModel");
                    // Communication / Activities
                    that._appendActivities(oJsonModel.getData());
                    // NotificationItem
                    oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData.results[0].to_MaintenanceNotification.to_MaintenanceNotificationItem.results[0]);
                    that.getView().setModel(oJsonModel, "notitemModel");

                    let bEnabled = false;
                    let oSaveButton = that.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::saveButton");
                    let oCancelButton = that.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::cancelButton");
                    let oCreateWarrantyButton = that.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::createWarrantyButton");
                    //let oUnlockButton = that.getView().byId("com.stadler.pm.notification::sap.suite.ui.generic.template.ObjectPage.view.Details::xSRAILxPM_NOTIFICATION--action::unlockButton");
                    if (oData.results[0].UserStatus === "MEAK") {
                        bEnabled = false;
                        oSaveButton.setVisible(false);
                        oCancelButton.setVisible(false);
                        // oCreateWarrantyButton ???
                        //oUnlockButton.setVisible(true);
                    } else if (oData.results[0].UserStatus === "MAKU" || oData.results[0].UserStatus === "MEKU") {
                        bEnabled = true;
                        oSaveButton.setVisible(true);
                        oCancelButton.setVisible(true);
                    } else {
                        oSaveButton.setVisible(false);
                        oCancelButton.setVisible(false);
                        // oCreateWarrantyButton ???
                        //oUnlockButton.setVisible(false);
                    }
                    that.getView().getModel("originvaluesModel").getData().isEnabled = bEnabled;
                    that.getView().getModel("originvaluesModel").refresh(true);
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
        },

        /**
         * append kind of communication or activites to forms
         * @param {*} oData 
         */
        _appendActivities: function (oData) {
            let oBoxKoc = this.getView().byId("vbKoc"); // communication
            let oBoxDamPos = this.getView().byId("vbDamagePosition");   // damage position
            let oBoxCause = this.getView().byId("vbCause");   // cause
            oBoxKoc.destroyItems();
            oBoxDamPos.destroyItems();

            let oAttr = oData.to_MaintNotificationActivity.results;
            let sValue = "";
            if (oAttr.length > 0) {
                const oI18n = this.getView().getModel("i18n").getResourceBundle();
                for (let key in oAttr) {

                    sValue = oAttr[key].MaintNotificationActivityCode + " - ";
                    if (oAttr[key].to_MaintNotificationActivityCode) {
                        sValue += oAttr[key].to_MaintNotificationActivityCode.InspectionCode_Text;
                    }
                    
                    // communication
                    if (oAttr[key].MaintNotifActivityCodeGroup === "ZCSFS001" 
                                && oAttr[key].MaintNotifActivityCodeCatalog === "8"
                                && oAttr[key].IsDeleted !=="X") {
                        oBoxKoc.addItem(new sap.m.Text({
                            text: sValue
                        }));
                    }
                    // position action
                    if (oAttr[key].MaintNotifActivityCodeGroup === "ZCSFS002" 
                                && oAttr[key].MaintNotifActivityCodeCatalog === "8"
                                && oAttr[key].IsDeleted !=="X") {
                        if (oAttr[key].MaintNotifActyTxt !== "") {
                            sValue += " - " + oAttr[key].MaintNotifActyTxt;
                        }
   
                        let oHBox = new sap.m.HBox({
                            alignContent: "SpaceBetween"
                        });
                        let oText = new sap.m.Text(this.createId("txtPosition" + key), {
                            text: sValue
                        });
                        oHBox.addItem(oText);
                        if (oAttr[key].NotificationHasLongText) {
                            let oButton = new sap.m.Button(this.createId("btnPosition" + key), {
                                icon: "sap-icon://document-text",
                                tooltip: oI18n.getText("longtext")
                            });
                            oButton.addStyleClass("sapUiTinyMarginBegin");
                            oButton.attachPress(this.getLongtext, this);
                            // leading zeros
                            let sName = oAttr[key].MaintenanceNotification.padStart(12, "0") + oAttr[key].MaintNotificationActivity;
                            oButton.data("name", sName);
                            oButton.data("object", "QMMA");
                            oHBox.addItem(oButton);
                        }
                        oBoxDamPos.addItem(oHBox);
                    }
                }
                
            } else {
                oBoxKoc.addItem(new sap.m.Text({
                    text: "-"
                }));
                oBoxDamPos.addItem(new sap.m.Text({
                    text: "-"
                }));
            }

            // cause
            if (false) {
                /* CR */
            
            oAttr = oData.to_MaintenanceNotificationItem.results[0].to_MaintenanceNotificationCause.results;
            sValue = "";
            if (oAttr.length > 0) {
                const oI18n = this.getView().getModel("i18n").getResourceBundle();
                for (let key in oAttr) {

                    sValue = oAttr[key].MaintNotificationCauseCode + " - ";
                    if (oAttr[key].to_MaintNotificationCauseCode) {
                        sValue += oAttr[key].to_MaintNotificationCauseCode.InspectionCode_Text;
                    }
                    
                    if (oAttr[key].IsDeleted !=="X") {
                        if (oAttr[key].MaintNotifCauseText !== "") {
                            sValue += " - " + oAttr[key].MaintNotifCauseText;
                        }
   
                        let oHBox = new sap.m.HBox({
                            alignContent: "SpaceBetween"
                        });
                        let oText = new sap.m.Text(this.createId("txtCause" + key), {
                            text: sValue
                        });
                        oHBox.addItem(oText);

                        let oButton = new sap.m.Button(this.createId("btnCause" + key), {
                            icon: "sap-icon://document-text",
                            tooltip: oI18n.getText("longtext")
                        });
                        oButton.addStyleClass("sapUiTinyMarginBegin");
                        oButton.attachPress(this.getLongtext, this);
                        // leading zeros
                        let sName = oAttr[key].MaintenanceNotification.padStart(12, "0") + oAttr[key].MaintenanceNotificationItem
                                    + oAttr[key].MaintenanceNotificationCause;
                        oButton.data("name", sName);
                        oButton.data("object", "QMUR");
                        oHBox.addItem(oButton);
                    
                        oBoxCause.addItem(oHBox);
                    }
                }
                
            } else {
                oBoxCause.addItem(new sap.m.Text({
                    text: "-"
                }));
            }
            }
        },


        /**
         * get views (client, Stadler, common)
         * @param {*} sNotification 
         */
        _getViews: function (sNotification) {
            let that = this;
            // leading zeros
            sNotification = sNotification.padStart(12, "0");
            const oI18n = this.getView().getModel("i18n").getResourceBundle();
            let sUrlParameters = "COMMON_VIEW_RESPONSIBLEP_VHSet,COMMON_VIEW_MALFUNCTEFFECT_VHSet";
            const oModel = this.getView().getModel();
            oModel.read("/NOTIF_DETAILSSet('" + sNotification + "')", {
                urlParameters: {
                    "$expand": sUrlParameters
                },
                success: function (oData, oResponse) {
                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oData.COMMON_VIEW_RESPONSIBLEP_VHSet.results.unshift({
                        Responsiblepartycode: "",
                        Responsiblepartytext: ""}
                    );
                    oData.COMMON_VIEW_MALFUNCTEFFECT_VHSet.results.unshift({
                        Malfunctioneffect: "",
                        Malfunctioneffecttext: ""}
                    );
                    oJsonModel.setData(oData);
                    that.getView().setModel(oJsonModel, "viewsModel");
                    // origin values (before save) and enablement of fields
                    let oOriginValModel = that.getView().getModel("originvaluesModel").getData();
                    oOriginValModel.malBeg = oData.Viewcommon.Malfunctionstartdate;
                    oOriginValModel.malBegTime = oData.Viewcommon.Malfunctionstarttime;
                    oOriginValModel.malEnd = oData.Viewcommon.Malfunctionenddate;
                    oOriginValModel.malEndTime = oData.Viewcommon.Malfunctionendtime;
                    oOriginValModel.malCode = oData.Viewcommon.Malfunctioneffect;
                    oOriginValModel.partyCode = oData.Viewcommon.Responsiblepartycode;
                    that.getView().getModel("originvaluesModel").refresh(true);
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
            // Attributes Client
            oModel.read("/NOTIF_DETAILSSet('" + sNotification + "')/toClientClassificationAttributesSet", {
                success: function (oData, oResponse) {
                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData);
                    that.getView().setModel(oJsonModel, "viewsClientAttrModel");
                    that._appendToViews("formClientView", oJsonModel.getData());
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
            // Attributes Stadler
            oModel.read("/NOTIF_DETAILSSet('" + sNotification + "')/toStadlerClassificationAttributesSet", {
                success: function (oData, oResponse) {
                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData);
                    that.getView().setModel(oJsonModel, "viewsStadlerAttrModel");
                    that._appendToViews("formStadlerView", oJsonModel.getData());
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
            // Attributes Common
            oModel.read("/NOTIF_DETAILSSet('" + sNotification + "')/toCommonClassificationAttributesSet", {
                success: function (oData, oResponse) {
                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.setData(oData);
                    that.getView().setModel(oJsonModel, "viewsCommonAttrModel");
                    that._appendToViews("formCommonView", oJsonModel.getData());
                },
                error: function (oError) {
                    let sMessage = oError.message + "\n" + oError.statusText;
                    new sap.m.MessageBox.show(sMessage, {
                        title: oI18n.getText("servererror"),
                        icon: sap.m.MessageBox.Icon.ERROR
                    });
                }
            });
        },

        /**
         * append attributes to views
         * @param {*} sControlId 
         * @param {*} oData 
         */
        _appendToViews: function (sControlId, oData) {
            let oControl = this.getView().byId(sControlId);
            let oAttr = oData.results;

            let oOriginValModel = this.getView().getModel("originvaluesModel").getData();

            const iDefaultLength = 15; // default content length
            let iLength = oControl.getContent().length; // actual content length
            // remove content from before
            if (iLength > iDefaultLength) {
                for (let i = iLength; i >= iDefaultLength; i--) {
                    oControl.removeContent((i));
                }
            }

            for (let key in oAttr) {
                // train and delay only
                if ((oAttr[key].Classname === "ZZUGNR" || oAttr[key].Classname === "ZVERSPAE")
                    && oAttr[key].Deletevalue === false ) {
                    let oValue;
                    oControl.addContent(new sap.m.Label({
                        text: oAttr[key].Chartext
                    }));
                    // common view: no style class and check if editable
                    if (sControlId === "formCommonView") {
                        // origin values (before save) and enablement of fields
                        if (oAttr[key].Classname === "ZZUGNR") {
                            oOriginValModel.train = oAttr[key].Charvalue;
                            if (this.getView().byId("inpTrain")) {
                                this.getView().byId("inpTrain").destroy();
                            }
                            oValue = new sap.m.Input(this.createId("inpTrain"), {
                                value: oAttr[key].Charvalue,
                                enabled: oOriginValModel.isEnabled
                            });

                        } else if (oAttr[key].Classname === "ZVERSPAE") {
                            oOriginValModel.delay = oAttr[key].Charvalue;
                            if (this.getView().byId("inpDelay")) {
                                this.getView().byId("inpDelay").destroy();
                            }
                            oValue = new sap.m.Input(this.createId("inpDelay"), {
                                value: oAttr[key].Charvalue,
                                enabled: oOriginValModel.isEnabled
                            });
                        }

                    } else {
                        oValue = new sap.m.Text({
                            text: oAttr[key].Charvalue
                        });
                        oValue.addStyleClass("sapUiTinyMarginTop");
                        oValue.addStyleClass("sapUiTinyMarginBottom");
                    }
                    oControl.addContent(oValue);
                }
            }
        },

        /**
         * open popover
         * @param {*} oOpener 
         * @param {*} sLongtext 
         */
        _openPopover: function (oOpener, sLongtext) {
            let oView = this.getView();
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "com.stadler.pm.notification.ext.fragment.Popover",
                    controller: this
                }).then(function(oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function(oPopover) {
                oPopover.destroyContent(0);
                let oText = new sap.m.Text({
                    text: sLongtext
                })
                oPopover.addContent(oText);
                oPopover.openBy(oOpener);
            });
        },

        /**
         * close popover
         */
        _closePopover: function () {
            let oPopover = this.getView().byId("notifPopover");
            if (oPopover !== undefined) {
                oPopover.destroyContent(0);
                oPopover.close();
            }
        },

        /**
         * Datum mit Zeitzone
         * @param {*} oDate 
         * @returns 
         */
        _dateToUTC: function (oDate) {
            let oNewDate = null;
            if (oDate) {
                oNewDate = new Date(oDate);
                oNewDate = new Date(oNewDate.getTime() - oNewDate.getTimezoneOffset() * 60000);
            }
            return oNewDate;
        },

        /**
         * returns date in style of: 12.03.2016
         * @param {*} oDate 
         */
        _getDate: function (oDate) {
            if (oDate === undefined) {
                return "";
            } else if (oDate !== null) {
                let oDateFormat = DateFormat.getDateTimeInstance({ pattern: "dd.MM.yyyy" });
                return oDateFormat.format(new Date(oDate));
            } else {
                return "";
            }
        },

        /**
         * 24 hours
         * @param {*} oTime 
         * @returns 
         */
        _timeFormatPT: function (oTime) {
            if (oTime === undefined) {
                return "";
            } else if (oTime !== null) {
                let oTimeFormat = DateFormat.getDateTimeInstance({ pattern: "PTHH'H'mm'M'ss'S'" });
                return oTimeFormat.format(new Date(oTime));
            } else {
                return "";
            }
        },

        formatDatewithPT: function(string1) {
			if (string1 !== null) {
				if (string1 !== undefined) {
					let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
					let formattedDate = new Date(string1.ms + TZOffsetMs);
					let newHours = (formattedDate.getHours()).toString();
					let newMinutes = (formattedDate.getMinutes()).toString();
					if (newHours.length === 1) {
						newHours = "0" + newHours;
					}
					if (newMinutes.length === 1) {
						newMinutes = "0" + newMinutes;
					}
					return newHours + ":" + newMinutes;
				}
			}
		}

    };
});