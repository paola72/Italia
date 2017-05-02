// Copyright [2016] [Banana.ch SA - Lugano Switzerland]
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
* metodo principale che genera il file xml
*/
function createInstance(param)
{
  //<DatiFatturaHeader>
  var xbrlDatiFatturaHeader = createInstance_DatiFatturaHeader(param);

  var xbrlContent = '';
  if (param.blocco == "DTE")
    xbrlContent = createInstance_DTE(param);
  else if (param.blocco == "DTR")
    xbrlContent = createInstance_DTR(param);

  //<DatiFattura> root element
  xbrlContent = xbrlDatiFatturaHeader + xbrlContent;
  var attrsNamespaces = {};
  for (var j in param.namespaces) {
    var prefix = param.namespaces[j]['prefix'];
    var namespace = param.namespaces[j]['namespace'];
    if (prefix.length > 0)
      attrsNamespaces[prefix] = namespace;
  }
  for (var j in param.schemaRefs) {
    var schema = param.schemaRefs[j];
    if (schema.length > 0) {
      if (!attrsNamespaces['xsi:schemaLocation'])
        attrsNamespaces['xsi:schemaLocation'] = '';
      if (attrsNamespaces['xsi:schemaLocation'].length>0)
        attrsNamespaces['xsi:schemaLocation'] += " ";
      attrsNamespaces['xsi:schemaLocation'] = attrsNamespaces['xsi:schemaLocation'] + schema;
    }
  }
  attrsNamespaces['versione'] = "DAT10";
  xbrlContent = xml_createElement("df:DatiFattura", xbrlContent, attrsNamespaces);

  //Output
  var results = [];
  results.push("<?xml version='1.0' encoding='UTF-8'?>");
  results.push(xbrlContent);
  return results.join ('\n');

}

/*
* Dati relativi a fatture  EMESSE. Da valorizzare per trasmettere i dati delle fatture emesse.
* Non devono essere riportati in questo blocco i dati delle così dette autofatture, cioè fatture 
* emesse dall'acquirente nei casi in cui non le abbia ricevute oppure, pur avendole ricevute, 
* abbia rilevato in esse delle irregolarità. Tali dati devono essere riportati come dati delle fatture ricevute.
* Se questo blocco è valorizzato, non dovranno essere valorizzati i blocchi 3 <DTR> e 4 <ANN>
* Occorrenze: <0.1>
*/
function createInstance_DTE(param) 
{
  var xbrlContent = createInstance_Blocco1(param);
  
  for (var i in param.customers) {
    var customerObj = param.customers[i];
    if (customerObj)
      xbrlContent += createInstance_Blocco2(customerObj, param);
  }
  if (xbrlContent.length>0) {
    xbrlContent += '\n';
  }
  var xbrlDTE =  '\n' + xml_createElement( "DTE", xbrlContent) + '\n';
  return xbrlDTE;
}

function createInstance_DTR(param) 
{
  var xbrlContent = createInstance_Blocco1(param);
  
  for (var i in param.suppliers) {
    var supplierObj = param.suppliers[i];
    if (supplierObj)
      xbrlContent += createInstance_Blocco2(supplierObj, param);
  }
  if (xbrlContent.length>0) {
    xbrlContent += '\n';
  }
  var xbrlDTR =  '\n' + xml_createElement("DTR", xbrlContent) + '\n';
  return xbrlDTR;
}

/*
* Blocco 2.1 <CedentePrestatoreDTE> e 3.1 <CessionarioCommittenteDTR>
* Occorrenze: <1.1>
*/
function createInstance_Blocco1(param) 
{
  var tag = ''
  if (param.blocco == 'DTE')
    tag = 'CedentePrestatoreDTE';
  else if (param.blocco == 'DTR')
    tag = 'CessionarioCommittenteDTR';

   if (tag.length<=0)
     return;

  var msgContext = '<' + tag + '>';
  
  //2.1.1   <IdentificativiFiscali>
  var xbrlContent = '\n' + xml_createElementWithValidation("IdPaese", getCountryCode(param.fileInfo["Address"]),1,'2',msgContext);
  xbrlContent += '\n' + xml_createElementWithValidation("IdCodice", param.fileInfo["Address"]["FiscalNumber"],1,'1...28',msgContext) +'\n';
  xbrlContent = '\n' + xml_createElementWithValidation("IdFiscaleIVA",xbrlContent,1);
  xbrlContent += '\n' + xml_createElementWithValidation("CodiceFiscale", param.fileInfo["Address"]["FiscalNumber"],0,'11...16',msgContext) +'\n';
  xbrlContent =  '\n' + xml_createElementWithValidation("IdentificativiFiscali",xbrlContent,1) +'\n';
  
  //2.1.2   <AltriDatiIdentificativi>
  var xbrlContent2 = '';
  if (param.fileInfo["Address"]["Company"].length) {
    xbrlContent2 = '\n' + xml_createElementWithValidation("Denominazione", param.fileInfo["Address"]["Company"],0,'1...80',msgContext);
  }
  else {
    xbrlContent2 = '\n' + xml_createElementWithValidation("Nome", param.fileInfo["Address"]["Name"],0,'1...60',msgContext);
    xbrlContent2 += '\n' + xml_createElementWithValidation("Cognome", param.fileInfo["Address"]["FamilyName"],0,'1...60',msgContext);
  }
  var xbrlContent3 = '\n' + xml_createElementWithValidation("Indirizzo", param.fileInfo["Address"]["Address1"],1,'1...60',msgContext) +'\n';
  //xbrlContent3 += xml_createElementWithValidation("NumeroCivico") +'\n';
  xbrlContent3 += xml_createElementWithValidation("CAP", param.fileInfo["Address"]["Zip"],1,'5',msgContext) +'\n';
  xbrlContent3 += xml_createElementWithValidation("Comune", param.fileInfo["Address"]["City"],1,'1...60',msgContext) +'\n';
  xbrlContent3 += xml_createElementWithValidation("Provincia", param.fileInfo["Address"]["State"],0,'2',msgContext) +'\n';
  xbrlContent3 += xml_createElementWithValidation("Nazione", getCountryCode(param.fileInfo["Address"]),1,'2',msgContext) +'\n';
  xbrlContent2 += '\n' + xml_createElementWithValidation("Sede", xbrlContent3,1) +'\n';
  xbrlContent +=  xml_createElementWithValidation("AltriDatiIdentificativi",xbrlContent2,1) +'\n';

  xbrlContent =  '\n' + xml_createElementWithValidation(tag,xbrlContent,1);
  return xbrlContent;
}

/*
* Blocco contenente le informazioni relative al cessionario/committente (cliente) e ai dati fattura a lui riferiti.
* Può essere replicato per trasmettere dati di fatture relative a clienti diversi
* Occorrenze: <1.1000>
*/
/*
* Blocco 2.2 <CessionarioCommittenteDTE> e 3.2 <CedentePrestatoreDTR>
* Occorrenze: <1.1000>
*/
function createInstance_Blocco2(accountObj, param) 
{
  var tag = ''
  if (param.blocco == 'DTE')
    tag = 'CessionarioCommittenteDTE';
  else if (param.blocco == 'DTR')
    tag = 'CedentePrestatoreDTR';

   if (tag.length<=0)
     return;

  var msgContext = '<' + tag + '> ' + accountObj["Account"] + ' ' + accountObj["Description"];
  var xbrlContent = '';
  if (accountObj) {
    //2.2.1   <IdentificativiFiscali>
    xbrlContent = '\n' + xml_createElementWithValidation("IdPaese", getCountryCode(accountObj),1,'2',msgContext);
    xbrlContent += '\n' + xml_createElementWithValidation("IdCodice", accountObj["FiscalNumber"],1,'1...28',msgContext) +'\n';
    xbrlContent = '\n' + xml_createElementWithValidation("IdFiscaleIVA",xbrlContent,1);
    xbrlContent += '\n' + xml_createElementWithValidation("CodiceFiscale", accountObj["FiscalNumber"],0,'11...16',msgContext) +'\n';
    xbrlContent =  '\n' + xml_createElementWithValidation("IdentificativiFiscali",xbrlContent,1) +'\n';

    //2.2.2   <AltriDatiIdentificativi>
    var xbrlContent2 = '';
    if (accountObj["OrganisationName"].length) {
      xbrlContent2 = '\n' + xml_createElementWithValidation("Denominazione", accountObj["OrganisationName"],0,'1...80',msgContext);
    }
    else {
      xbrlContent2 = '\n' + xml_createElementWithValidation("Nome", accountObj["FirstName"],0,'1...60',msgContext);
      xbrlContent2 += '\n' + xml_createElementWithValidation("Cognome", accountObj["FamilyName"],0,'1...60',msgContext);
    }
    var xbrlContent3 = '\n' + xml_createElementWithValidation("Indirizzo", accountObj["Street"],1,'1...60',msgContext) +'\n';
    xbrlContent3 += xml_createElementWithValidation("CAP", accountObj["PostalCode"],1,'5',msgContext) +'\n';
    xbrlContent3 += xml_createElementWithValidation("Comune", accountObj["Locality"],1,'1...60',msgContext) +'\n';
    xbrlContent3 += xml_createElementWithValidation("Provincia", accountObj["Region"],0,'2',msgContext) +'\n';
    xbrlContent3 += xml_createElementWithValidation("Nazione", getCountryCode(accountObj),1,'2',msgContext) +'\n';
    xbrlContent2 += '\n' + xml_createElementWithValidation("Sede", xbrlContent3,1) +'\n';
    xbrlContent +=  xml_createElementWithValidation("AltriDatiIdentificativi", xbrlContent2,1) +'\n';

    /*
    * Blocco obbligatorio. Può essere replicato per trasmettere dati di più fatture relative allo stesso cliente
    */
    //2.2.3 <DatiFatturaBodyDTE> o 3.2.3 <DatiFatturaBodyDTR>
    for (var i in accountObj.rows) {
      if (accountObj.rows[i]) {
        msgContext = '[' + accountObj.rows[i]["JTableOrigin"] + ': Riga ' + (parseInt(accountObj.rows[i]["JRowOrigin"])+1).toString() +'] <DatiFatturaBody' + param.blocco + '>';
        var dataEmissione = accountObj.rows[i]["JInvoiceIssueDate"];
        //2.2.3.1  <DatiGenerali>
        xbrlContent3 = '\n' + xml_createElementWithValidation("TipoDocumento", accountObj.rows[i]["DF_TipoDoc"],1,'4',msgContext);
        xbrlContent3 += '\n' + xml_createElementWithValidation("Data", dataEmissione,1,'10',msgContext);
        xbrlContent3 += '\n' + xml_createElementWithValidation("Numero", accountObj.rows[i]["DocInvoice"],1,'1...20',msgContext) + '\n';
        if (param.blocco == 'DTR')
          xbrlContent3 += '\n' + xml_createElementWithValidation("DataRegistrazione", accountObj.rows[i]["JDate"],1,'10',msgContext) + '\n';
        xbrlContent2 = '\n' + xml_createElementWithValidation("DatiGenerali", xbrlContent3,1);
        //2.2.3.1  <DatiRiepilogo>
        xbrlContent3 = '\n' + xml_createElementWithValidation("ImponibileImporto", accountObj.rows[i]["DF_Imponibile"],1,'4...15',msgContext);
        var xbrlContent4 = '\n' + xml_createElementWithValidation("Imposta", accountObj.rows[i]["DF_Imposta"],0,'4...15',msgContext);
        xbrlContent4 += '\n' + xml_createElementWithValidation("Aliquota", accountObj.rows[i]["DF_Aliquota"],0,'4...6',msgContext) + '\n';
        xbrlContent3 += '\n' + xml_createElementWithValidation("DatiIVA",xbrlContent4,1) ;
        if (accountObj.rows[i]["DF_Natura"].length)
          xbrlContent3 += '\n' + xml_createElementWithValidation("Natura", accountObj.rows[i]["DF_Natura"],0,'2');
        if (accountObj.rows[i]["DF_Detraibile"].length)
          xbrlContent3 += '\n' + xml_createElementWithValidation("Detraibile", accountObj.rows[i]["DF_Detraibile"],0,'4...6');
        if (accountObj.rows[i]["DF_Deducibile"].length)
          xbrlContent3 += '\n' + xml_createElementWithValidation("Deducibile",accountObj.rows[i]["DF_Deducibile"],0,'2');
        if (accountObj.rows[i]["DF_Natura"].length || accountObj.rows[i]["DF_Detraibile"].length || accountObj.rows[i]["DF_Deducibile"].length)
          xbrlContent3 += '\n';
        xbrlContent2 += '\n' + xml_createElementWithValidation("DatiRiepilogo", xbrlContent3,1) +'\n';
        xbrlContent +=  xml_createElementWithValidation("DatiFatturaBody" + param.blocco, xbrlContent2,1) +'\n';
      }
    }
  }
  xbrlContent =  '\n' + xml_createElement(tag, xbrlContent);
  return xbrlContent;
}

/*
* Blocco da valorizzare solo se si intende identificare con un progressivo il file che si sta trasmettendo.
* L'elemento 1.3 <IdSistema> non va mai valorizzato in quanto riservato al sistema
* Occorrenze: <0.1>
*/
function createInstance_DatiFatturaHeader(param) 
{
  return '';
}
