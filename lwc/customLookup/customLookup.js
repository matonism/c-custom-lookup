//Note: This is not currently mobile friendly or accessibile
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

	//TODO: Wire formatting regarding newline
	@wire(getDefaultRecord, {
		recordId: '$defaultRecordId',
		objectName: '$objectName'
	}) setSelectedRecordToDefault({error, data}){
		if(data){
			this.selectedRecord = data;
		}else if(error){
			console.log('there was no default record');
		}
	}

	handleSearchKeywordSubmission(event){
		this.searchKeyword = event.detail.searchKeyword;
		this.handleLookupModalOpen();
	}

	//This customlookupselect event should be caught by within components
	handleRecordSelection(event){
		this.handleLookupModalClose();
		this.selectedRecord = event.detail;
		let selectedEvent = new CustomEvent('customlookupselect', {
			detail : {
				record: this.selectedRecord,
				fieldName: this.fieldName
			}
		});
		this.dispatchEvent(selectedEvent);
	}

	handleLookupModalClose(){
		let modal = this.template.querySelector('c-popup-modal');
		if(modal){
			modal.hide();
		}
	}

	handleLookupModalOpen(){
		let modal = this.template.querySelector('c-popup-modal');
		if(modal){
			modal.show();
		}
	}
}