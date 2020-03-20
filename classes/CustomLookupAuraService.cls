public with sharing class CustomLookupAuraService {

	@AuraEnabled(cacheable=true)
	public static SObject getDefaultRecord(String recordId, String objectName){
		String queryString = 'SELECT Id, Name FROM ' + objectName + ' WHERE Id = \'' + recordId + '\'';
		System.debug(queryString);
		List<SObject> records = Database.query(queryString);
		
		if(records.size() == 1){
			return records.get(0);
		}

		return null;
	}

	//fetch records for lookup drop down quick results
	@AuraEnabled(cacheable=true)
	public static List<SObject> fetchLookUpRecords (String searchKeyword, String objectName, String jsonColumnData, Integer limiter){

		List<sObject> searchResults = new List<sObject> ();
		List<ColumnData> columnData = (List<ColumnData>)JSON.deserialize(jsonColumnData, List<ColumnData>.class);
		cleanColumnData(columnData);

		List<String> fieldsToCheckAgainstKeyword = getFieldsToCheckAgainstKeyword(objectName, columnData);
		List<String> fieldsToDisplayInColumns = getFieldsToDisplayInColumns(objectName, columnData);

		String selectStatement = buildSelectStatement(fieldsToDisplayInColumns);
		String whereStatement = buildWhereClause(objectName, fieldsToCheckAgainstKeyword, searchKeyword);
		String orderStatement = buildOrderStatement('CreatedDate', 'desc');
		String limitStatement = buildLimitStatement(limiter);
		
		String sQuery = selectStatement + objectName + ' ' + whereStatement + orderStatement + limitStatement;
		System.debug(sQuery);
		List<sObject> lstOfRecords = Database.query(sQuery);

		for (SObject obj: lstOfRecords){
			searchResults.add(obj);
		}

		return searchResults;
	}

	//Fetch records for the table of displayed records in the popup modal
	@AuraEnabled(cacheable=true)
	public static CustomLookupTableResult fetchLookupRecordsForModalTable(String objectName, String columnString, String searchKey, String fieldToSort, String direction, Integer pageNumber, Integer pageSize) {

		CustomLookupTableResult result = new CustomLookupTableResult();

		List<ColumnData> columnData = (List<ColumnData>)JSON.deserialize(columnString, List<ColumnData>.class);
		cleanColumnData(columnData);

		List<String> fieldsToCheckForKeyword = getFieldsToCheckAgainstKeyword(objectName, columnData);
		List<String> fieldsToDisplayInColumns = getFieldsToDisplayInColumns(objectName, columnData);

		String selectStatement = buildSelectStatement(fieldsToDisplayInColumns);
		String whereStatement = buildWhereClause(objectName, fieldsToCheckForKeyword, searchKey);

		String fullQuery = selectStatement + objectName + ' ' + whereStatement;

		List<sObject> allPossibleLookupRecords = Database.query(fullQuery);

		result.totalItemCount = allPossibleLookupRecords.size();

		String orderStatement = buildOrderStatement(fieldToSort, direction);
		String limitStatement = buildLimitStatement(pageSize);
		String offsetStatement = ' OFFSET ' + (pageNumber-1) * pageSize;
		
		String paginationQuery = fullQuery + orderStatement + limitStatement + offsetStatement;

		List<Object> searchList = Database.query(paginationQuery);
		System.debug(paginationQuery);
		result.records = searchList;
		System.debug(result);
		return result;
	}


	private static List<String> getFieldsToCheckAgainstKeyword(String objectName, List<ColumnData> columnData){
		
		List<String> fieldsToCheckAgainstKeyword = new List<String>();
		SObjectType r = ((SObject)(Type.forName('Schema.'+objectName).newInstance())).getSObjectType();
		DescribeSObjectResult d = r.getDescribe();
		for(ColumnData data : columnData){

			if(d.fields.getMap().get(data.apiName) != null && data.isSearchable){
				if(d.fields.getMap().get(data.apiName).getDescribe().getType() == Schema.DisplayType.STRING){
					fieldsToCheckAgainstKeyword.add(data.apiName);
				}
			}
		}

		return fieldsToCheckAgainstKeyword;
	}

	//Does not allow for multi-level queries because lightning-datatable does not support them
	private static List<String> getFieldsToDisplayInColumns(String objectName, List<ColumnData> columnData){
		
		List<String> fieldsToDisplayInColumns = new List<String>();
		SObjectType r = ((SObject)(Type.forName('Schema.'+objectName).newInstance())).getSObjectType();
		DescribeSObjectResult d = r.getDescribe();
		for(ColumnData data : columnData){

			if(d.fields.getMap().get(data.apiName) != null){
				fieldsToDisplayInColumns.add(data.apiName);
			}
		}

		return fieldsToDisplayInColumns;
	}

	private static String buildSelectStatement(List<String> fields){

		String selectStatement = 'SELECT Id, Name';
		for(Integer i = 0; i < fields.size(); i++){
			if(fields.get(i) != 'Id' && fields.get(i) != 'Name'){
				selectStatement += ', ' + fields.get(i);
			}
		}

		selectStatement += ' FROM ';

		return selectStatement;
	}

	private static String buildWhereClause(String objectName, List<String> fieldsToCheckAgainstKeyword, String searchKey){
		String whereStatement = '';
		for(Integer i = 0; i<fieldsToCheckAgainstKeyword.size(); i++){
			if(i == 0){
				whereStatement += 'WHERE ( ';
			}
			//Consider Removing name query because it gives extraneous results
			//"Mark M" will yeild Mark Hons becasue Mark still has an M (logic: if "Mark" is in "Mark Hons" and if "M" is in "Mark Hons")
			if(fieldsToCheckAgainstKeyword.get(i) == 'Name') {
				whereStatement += buildNameQuery(searchKey);
			} else {
				whereStatement += fieldsToCheckAgainstKeyword[i] + ' LIKE \'%' + searchKey + '%\' ';
			}

			if(i < fieldsToCheckAgainstKeyword.size() - 1) {
				whereStatement = whereStatement + 'OR ';
			}

			if(i == fieldsToCheckAgainstKeyword.size()-1){
				whereStatement = whereStatement + ') ';
			}

		}

		return whereStatement;
	}

	private static String buildNameQuery(String searchKey) {
		String whereStatement = '';
		
		List<String> searchTokens = searchKey.split(' ');
		if(searchTokens.size() > 1) {
			whereStatement = '(';
			for(Integer j = 0; j < searchTokens.size(); j++) {
				whereStatement = whereStatement + 'Name LIKE \'%' + String.escapeSingleQuotes(searchTokens[j]) + '%\'';
				if(j != searchTokens.size() - 1) {
					whereStatement = whereStatement + ' AND ';
				}
			}

			whereStatement = whereStatement + ') ';
		} else {
			whereStatement = 'Name LIKE \'%' + String.escapeSingleQuotes(searchKey) + '%\' ';
		}
		return whereStatement;
	}


	public static String buildOrderStatement(String fieldToSort, String direction){

		String orderStatement = '';
		if(String.isNotEmpty(fieldToSort)){
			orderStatement += ' ORDER BY ' + fieldToSort;
			if(!String.isBlank(direction)){
				orderStatement += ' ' + direction.toUpperCase();
			}
			orderStatement += ' NULLS LAST';
		}else{
			orderStatement += ' ORDER BY CreatedDate DESC ';
		}
		return orderStatement;
	}

	public static String buildLimitStatement(Integer limiter){
		
		String limitStatement = '';
		if (limiter != null) {
			limitStatement = ' LIMIT ' + limiter + ' ';
		} else {
			limitStatement = ' LIMIT 5 ';
		}
		return limitStatement;
	}

	public with sharing class CustomLookupTableResult{
		@AuraEnabled
		public Integer totalItemCount { get; set; }

		@AuraEnabled
		public Object[] records { get; set; }
	}

	private static void cleanColumnData(List<ColumnData> columnData){
		for(ColumnData data : columnData){
			if(data.isSearchable == null){
				data.isSearchable = true;
			}
		}	
	}

	private class ColumnData{

		String apiName;
		String label;
		Boolean isClickable;
		Boolean isSortable;
		Boolean isSearchable;
		Boolean isDisplayable;
		
		public ColumnData(String apiName, String label, Boolean isClickable, Boolean isSortable, Boolean isSearchable, Boolean isDisplayable){
			this.apiName = apiName;
			this.label = label;
			this.isSearchable = isSearchable;
			this.isClickable = isClickable;
			this.isSortable = isSortable;
			this.isDisplayable = isDisplayable;

		}
	}
}