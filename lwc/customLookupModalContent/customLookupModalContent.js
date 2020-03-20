import { LightningElement, track, api, wire } from 'lwc';
import fetchLookupRecordsForModalTable from '@salesforce/apex/CustomLookupAuraService.fetchLookupRecordsForModalTable';
import { refreshApex } from '@salesforce/apex';

export default class CustomLookupModalContent extends LightningElement {
    
    //lookup input properties
    @api label;
    @api objectLabel;
    @api objectName;
    @api columnsToShow;
    @api icon;
    @api fieldLevelHelp;
    @api limitAttribute;
    @api clearCache;
    
    //paginator properties
    @api pageSize = 2;
    @track pageNumber = 1;
    @track totalItemCount = 0;

    //data table properties
    @track sortBy = 'CreatedDate';
    @track sortDirection = 'desc';


    @track searchResults = [];
    @track initComplete = false;

    @track selectedRecord;

    __privateSearchKeyword;

    @api 
    get searchKeyword(){
        return this.__privateSearchKeyword;
    }

    set searchKeyword(value){
        this.pageNumber = 1;
        this.__privateSearchKeyword = value;
    };

    get showError(){
        return this.initComplete && (this.searchResults == null || this.searchResults.length === 0);
    }
    
    get columnsString(){
        return JSON.stringify(this.columnsToShow);
    }

    get errorMessage() {
        if(this.searchResults == null){            
            return 'Something went wrong in your search.  Please contact your admin.';
        }else if(this.searchResults.length === 0){
            return 'No results for \"' + this.searchKeyword + '\" in ' + this.objectLabel + 's';
        }else{
            return '';
        }
    }

    get dataTableColumns(){
        let dataTableColumns = [];
        for(let column of this.columnsToShow){
            if(column.isDisplayable === true || column.isDisplayable === undefined){

                let dataTableColumn = { 
                    label: column.label, 
                    type: 'clickableCell', 
                    sortable: column.isSortable,
                    fieldName: column.apiName,
                    typeAttributes: {
                        recordId : { fieldName: 'Id'},
                        value : { fieldName: column.apiName},
                        isClickable : column.isClickable || column.isClickable === undefined
                    }
                };
                dataTableColumns.push(dataTableColumn);
            }
        }
        return dataTableColumns;
    }

	@wire(fetchLookupRecordsForModalTable, {
		objectName: '$objectName',
        columnString: '$columnsString',
		searchKey: '$searchKeyword',
        fieldToSort: '$sortBy',
        direction: '$sortDirection',
        pageNumber: '$pageNumber',
        pageSize: '$pageSize'
    })
    handleSearchResults({ error, data }) {
        if(data){
            this.searchResults = data.records;
            this.totalItemCount = data.totalItemCount;
            this.initComplete = true;
        }else if(error){
            this.initComplete = false;
            this.initComplete = true;
        }
    }
	
	connectedCallback(){
		if(!!this.clearCache){
			refreshApex(this.handleSearchResults);
		}
    }
    
    handleSelectedRecordId(event){
        let selectedRecordId = event.detail.recordId;
        this.selectedRecord = this.searchResults.find((record) => {
            return record.Id === selectedRecordId;
        });
        
        const selectEvent = new CustomEvent('customlookupselect', { detail: this.selectedRecord });
        this.dispatchEvent(selectEvent);
    }

    handleSelectedRecord(event){
        this.selectedRecord = event.detail
        const selectEvent = new CustomEvent('customlookupselect', { detail: this.selectedRecord });
        this.dispatchEvent(selectEvent);
    }

    handleSort(event){
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.pageNumber = 1;
    }
    
    // rowSelectedAccordion(event){
    //     this.selectedRecord = event.detail.selectedRecord;
    //     const selectEvent = new CustomEvent('selection', { detail: this.selectedRecord });
    //     this.dispatchEvent(selectEvent);
    // }


    handlePreviousPage() {
        this.pageNumber = this.pageNumber - 1;
    }

    handleNextPage() {
        this.pageNumber = this.pageNumber + 1;
    }

    goToFirstPage(){
        this.pageNumber = 1;
    }

    goToLastPage(){
        this.pageNumber = this.totalPages;
    }

    get totalPages() {
        return Math.ceil(this.totalItemCount / this.pageSize);
    }
}