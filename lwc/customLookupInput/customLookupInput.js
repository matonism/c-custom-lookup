import { LightningElement, track, api, wire } from 'lwc';
import fetchLookUpRecords from '@salesforce/apex/CustomLookupAuraService.fetchLookUpRecords';
import { refreshApex } from '@salesforce/apex';

const DELAY = 300;

export default class CustomLookupInput extends LightningElement {

	@api label;
	@api objectName;
	@api objectLabel;
	@api icon;
	@api limitAttribute = 5;
	@api isRequired = false;
	@api hasError = false;
	@api errorText = 'Complete this field.';
	@api columnsToShow;
	@api fieldLevelHelp;
	@track showError = false;

	@api selectedRecord;
	@track listOfSearchRecords = [];
	@api searchKeyword = '';
	@api clearCache;
	@track isSearchKeywordLongEnough = false;

	@track isResultsContainerVisible = false;
	
	@wire(fetchLookUpRecords, {
		searchKeyword: '$searchKeyword',
		objectName: '$objectName',
		jsonColumnData: '$columnString',
		limiter: '$limitAttribute'
	})
	listOfSearchRecords;
	
	connectedCallback(){
		if(!!this.clearCache){
			refreshApex(fetchLookUpRecords);
		}
	}

	handleFocus(){
		this.hasError = false;
		this.isResultsContainerVisible = true;
	}

	//used because {} evaluates to true for template if:true
	get isRecordSelected(){
		return !!this.selectedRecord && Object.keys(this.selectedRecord).length != 0;
	}

	get columnString(){
		return JSON.stringify(this.columnsToShow);
	}

	get inputClass() {
		return this.hasError ? 'hasError' : '';
	}

	get hasLabel() {
		if(this.label) {
			return true;
		}
		return false;
	}

	handleBlur(){
		this.blurTimeout = window.setTimeout(() => {
			this.isResultsContainerVisible = false;
		}, DELAY );        
	}

	handleSearchChange(event){
		window.clearTimeout(this.delayTimeout);
		const searchKey = event.target.value;
		this.isSearchKeywordLongEnough = searchKey.length > 1;

		this.delayTimeout = setTimeout(() => {
			this.searchKeyword = searchKey;
		}, DELAY);
	}

	clear(){
		const clearEvent = new CustomEvent('customlookupselect', {detail: {}});
		this.dispatchEvent(clearEvent);
	}

	handleRecordSelection(event){
		this.selectedRecord = event.detail;

		const selectEvent = new CustomEvent('customlookupselect', { 
			bubbles: true,
			cancelable: true,
			composed: true,
			detail: this.selectedRecord 
		});
		this.dispatchEvent(selectEvent);

		this.isResultsContainerVisible = false;
		this.closeModal();
	}

	handleSearchKeywordSubmit(){
		this.isResultsContainerVisible = false;
		let event = new CustomEvent('searchkeywordsubmit', {
			detail: {searchKeyword: this.searchKeyword},
            bubbles: true,
			composed: true
		});
		this.dispatchEvent(event);
	}

	closeModal() {
		let event = new CustomEvent('lookupmodalclose', {
            bubbles: true,
			composed: true
		});
		this.dispatchEvent(event);
	}

	keyCheck(event){
		if (event.which === 13 && this.isSearchKeywordLongEnough) {
			this.handleSearchKeywordSubmit();
		}
	}
}