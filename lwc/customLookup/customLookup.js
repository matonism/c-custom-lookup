import { LightningElement, api, wire } from 'lwc';
import getDefaultRecord from '@salesforce/apex/CustomLookupAuraService.getDefaultRecord';

export default class CustomLookup extends LightningElement {

	//Used for lookup input functionality
	@api objectLabel; //required
	@api objectName; //required
	@api fieldLabel; //required
	@api fieldName; //required
	@api icon;
	@api limitAttribute = 5;
	@api isRequired = false;
	@api hasError = false;
	@api errorText = 'Complete this field.';
	@api fieldLevelHelp;
	
	//set as api in case we want to set the default record
	@api defaultRecordId;

	//set as api in case we want to default this value
	@api selectedRecord;

	//These are the fields that get displayed in columns and have their values checked against the search string
	//isClickable, isSortable, and isDisplayable are only relevant for the lookup modal
	@api columns = [
		{apiName: 'Name', label: 'Name', isSearchable: true, isClickable: true, isSortable: true, isDisplayable: true},
		{apiName: 'Id', label: 'Id', isSearchable: false, isClickable: false, isSortable: false, isDisplayable: false}
	];

	//used for modal and pagination
	@api pageSize = 5;

	//used to communicate between lookup-input and modal
	@api searchKeyword = '';

	//used to toggle clearing cache automatically so wire methods are always up to date
	@api clearCache = false;

	@wire(getDefaultRecord, {
		recordId: '$defaultRecordId',
		objectName: '$objectName',
	}) 
    setSelectedRecordToDefault({error, data}){
		if(!!data){
			this.selectedRecord = data;
		}else if(!!error){
			console.log('there was no default record');
		}
	}

	handleLookupModalClose(event){
		event.stopPropagation();
		let modal = this.template.querySelector('c-popup-modal');
		if(!!modal){
			modal.hide();
		}
	}

	handleSearchKeywordSubmission(event){
		event.stopPropagation();
		this.searchKeyword = event.detail.searchKeyword;
		let modal = this.template.querySelector('c-popup-modal');
		if(!!modal){
			modal.show();
		}
	}

	//This customlookupselect event should be caught by parent components
	handleRecordSelection(event){
		event.stopPropagation();
		let modal = this.template.querySelector('c-popup-modal');
		if(!!modal){
			modal.hide();
		}
		this.selectedRecord = event.detail;
		let selectedEvent = new CustomEvent('customlookupselect', {
			bubbles: true,
			cancelable: true,
			composed: true,
			detail : {
				record: this.selectedRecord,
				fieldName: this.fieldName
			}
		});
		this.dispatchEvent(selectedEvent);
	}
}