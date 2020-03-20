# c-custom-lookup


## Description

This repository is made up of `c-custom-lookup` lightning web component, its child components, and an apex service back-end.  You can use the `c-custom-lookup` lwc in a parent component in order to fetch any record as a part of a form.

The `c-custom-lookup` returns the selected results to the parent component using a custom event.  The detail of the event contains the field you are trying to set along with the record you are trying to look up to.  The detail includes the entire record rather than just the Id of the record to handle a wider use case.

## Example

In the example below, we will be creating a standalone component for the Contact record page that allows a user to set the parent Account on Contact by searching for potential options using `c-custom-lookup`.

We've encapsulated `c-custom-lookup` in some markup for UI purposes.  The `c-custom-lookup` component requires the `field-label`, `field-name`, `object-name`, and `object-label` fields be populated at a minimum.  We have also specified an `icon`, additional fields to search, display, and sort by in the `columns` attribute, a `default-record-id` to start with, and an `oncustomlookupselect` action to take when a value is selected.  A full list of options is [shown below in the Properties table](#properties).

```html
<template>
    <lightning-card title="Parent Account Form">
        
        <div class="slds-p-around_small">
            <c-custom-lookup 
                field-label="Account Name" 
                field-name="AccountId"
                object-name="Account" 
                object-label="Account" 
                icon="standard:account"
                columns={columns}
                default-record-id={contact.AccountId}
                oncustomlookupselect={setAccountOnContact}>
            </c-custom-lookup>
        </div>

        <div slot="footer">
            <lightning-button label="Save Lookup" onclick={saveRecord}></lightning-button>
        </div>

    </lightning-card>
</template>
```

Our javascript controller does a number of things.  For setup, we create an array of JSON objects indicating the fields we want to capture upon lookup record selection. (The columns attribute is not required.)  In each JSON object, we must specify an `apiName` and `label` for each field. We have additionally chosen set the `isSortable`, `isSearchable`, and `isClickable` properties when the default values are not desired.  These additional properties control different behaviors within the lookup input and lookup modal specific to each field.  [The full specification for the Columns Property objects is listed below](#columns-properties).  

On load, we retrieve the contact for the current record page we are on using the wired uiRecordApi function, `getRecord`.  We make sure to get the AccountId field for the contact because that is the lookup field we want to control using `c-custom-lookup`.

When a record is selected, we run the `setAccountOnContact` method to assign the AccountId field to the new Id for the selected record. [The full specification for the customlookupselect event is listed below](#events)

Lastly, on button click, we save the record using the the `updateRecord` method from uiRecordApi and display a toast message.  And there you have it, you can now set AccountId on Contact like you never have (or wanted to) before.


```js
import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import CONTACT_FIELD_ACCOUNT_ID from '@salesforce/schema/Contact.AccountId';

export default class ContactAccountManager extends LightningElement {
    @api recordId;
    contact = {};
    
    columns = [
        {
            apiName: 'Name',
            label: 'Account',
            isSortable: true
        },
        {
            apiName: 'AccountNumber',
            label: 'Account Number',
            isSortable: true,
        },
        {
            apiName: 'Phone',
            label: 'Telephone',
            isClickable: false,
            isSearchable: false
        },
        {
            apiName: 'Website',
            label: 'Website',
            isClickable: false,
            isSortable: true,
        }
    ];

    @wire(getRecord, {recordId: '$recordId', fields: [CONTACT_FIELD_ACCOUNT_ID]})
    getContactRecord({error, data}){
        if(!!data){
            let tempContact = {Id: this.recordId};
            Object.keys(data.fields).forEach(field => {
                tempContact[field] = data.fields[field].value;
            });
            this.contact = tempContact;

        }else if(!!error){
            console.log(error);
        }
    }

    setAccountOnContact(event){
        if(!!event.detail.record.Id){
            this.contact[event.detail.fieldName] = event.detail.record.Id;
        }else{
            this.contact[event.detail.fieldName] = null;
        }
    }

    saveRecord(){
        updateRecord({fields: this.contact})
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Contact updated',
                    variant: 'success'
                })
            );
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }
}
```


## Reference

### Events

| Name | Description | Example |
|---|---|---|
| `oncustomlookupselect` | action to be taken when a lookup selection is made in either the input field or in the lookup modal.  Any fields valid specified in the columns property will be returned in the event's record property | {<br/>fieldName:  "Account",<br/>record: {Name: "Test Account", Id: "0011g00000kMdB5AAK", Phone: "216-111-1111"}<br/>} |


### Properties

| Name | Data Type | Description | Default | Example |
|---|---|---|---|---|
| `object-label`* | String | "(required)<br/>The label of the lookup object" | n/a | Contact, Account, Custom Object |
| `object-name`* | String | "(required)<br/>The API name of the lookup object" | n/a | Contact, Account, Custom_Object__c | 
| `field-label`* | String | "(required)<br/>The label of the field being set by the lookup input" | n/a | Parent Account, Lookup Relationship | 
| `field-name`* | String | "(required)<br/>The API name of the field being set by the lookup input" | n/a | Account__c, Lookup_Relationship__c 
| `icon` | String | The name of a standard icon provided by the Salesforce Lightning Design System | n/a | standard:account, custom:custom24 | 
| `limit-attribute` | Integer | The maximum number of possible lookup options listed in the dropdown for a given search term | 5 | n/a | 
| `is-required` | Boolean | Specifies whether or not the lookup field should be required.  If it is moved out of focus, it is given error text signifying that it is required | FALSE | n/a | 
| `has-error` | Boolean | Specifies whether or not the lookup field has an error.  Allows the parent component to specify the error condition and display error-text | FALSE | n/a | 
| `error-text` | String | Specifies the error text displayed beneath the component when has-error is true | Complete this field. | Please complete this field |
| `field-level-help` | String | Additional help text provided in an (i) icon next to the input field | n/a | This is the Primary Contact on an Account | 
| `default-record-id` | String | The id of a record that you want to display by default when the component loads.  This allows the parent component to preset the lookup field | n/a | 0011g00000kMdB5AAK | 
| `selected-record` | Object | A record that you want to display by default when the component loads.  This allows the parent component to preset the lookup field. The record must be formatted as an object with an Id and Name at minimum | n/a | {Id: '0011g00000kMdB5AAK', Name: 'Test Account'} |
| `columns` | Array | "A array of formatted JSON objects containing the fields you wish to search among, display, select, and sort by when gathering the options to choose your lookup field from.   Any field specified will be queried for, captured in a JSON object, and can be returned to your parent component upon record selection.  Each JSON object is formatted as specified in the columns property section below.<br/><br/>Note: This does not support multiple level lookup fields.  Fields using '__r' syntax will not work" | "[{apiName: ""Id"", label: ""Id"", isSearchable: false, isDisplayable: false, isSortable: false, isClickable: false},<br/>{apiName: ""Name"", label: ""Name"", isSearchable: true, isDisplayable: true, isSortable: true, isClickable: true}]" | "[<br/>{apiName: ""Id"", label: ""Id"", isSearchable: false, isDisplayable: false, isSortable: false, isClickable: false},<br/>{apiName: ""Name"", label: ""Name"", isSearchable: true, isDisplayable: true, isSortable: true, isClickable: true},<br/>{apiName: ""Email"", label: ""Email Address"", isSearchable: true, isDisplayable: true, isSortable: true, isClickable: false},<br/>{apiName: ""Phone"", label: ""Phone"", isSearchable: false, isDisplayable: true, isSortable: false, isClickable: false}<br/>]" |
| `page-size` | Integer | The number of records to display on one page of the lookup modal table | 5 | n/a | 
| `search-keyword` | String | A keyword used to search for records that have fields containing it.  This can be used to set a default lookup keyword. (The fields to search are specified in the columns attribute.  If not specified, it will search the Name field) | n/a | n/a | 
| `clear-cache` | Boolean | Controls the caching of records. Meant to be used in the event of caching issues that prevent the most up to date records from being displayed | FALSE | n/a |

### Columns Properties

| Name | Data Type | Description | Default |
|---|---|---|---|---|
| `apiName` | String | "(*Required if specifying columns)<br/>The API Name of the field" | n/a |
| `label` | String | "(*Required if specifying columns)<br/>The label of the field" | n/a |
| `isSearchable` | Boolean | Determines if you should search this field when querying options based on your search term | TRUE |
| `isDisplayable` | Boolean | Determines if this field will display in the lookup modal. You can hide fields from the lookup modal but still capture them for use in your parent component | TRUE |
| `isSortable` | Boolean | Determines if you will be able to sort by this field in the lookup modal table | FALSE |
| `isClickable` | Boolean | Determines if you can select this lookup option by clicking on this field in the lookup modal | TRUE |