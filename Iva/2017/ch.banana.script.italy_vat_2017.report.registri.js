// Copyright [2017] [Banana.ch SA - Lugano Switzerland]
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
//
// @api = 1.0
// @id = ch.banana.script.italy_vat_2017.report.registri.js
// @description = IVA Italia 2017: Registri IVA...
// @doctype = *;110
// @encoding = utf-8
// @includejs = ch.banana.script.italy_vat_2017.errors.js
// @includejs = ch.banana.script.italy_vat_2017.journal.js
// @includejs = ch.banana.script.italy_vat_2017.xml.js
// @inputdatasource = none
// @pubdate = 2017-08-22
// @publisher = Banana.ch SA
// @task = app.command
// @timeout = -1

var debug = true;

/*
 * Update script's parameters
*/
function settingsDialog() {

  var param = initParam();
  var savedParam = Banana.document.getScriptSettings();
  if (savedParam.length > 0) {
    param = JSON.parse(savedParam);
  }
  param = verifyParam(param);
  
  var accountingData = {};
  accountingData = readAccountingData(accountingData);
  if (accountingData.accountingYear.length<=0) {
    return false;
  }
  
  var dialog = Banana.Ui.createUi("ch.banana.script.italy_vat_2017.report.registri.dialog.ui");
  //Groupbox periodo
  var meseRadioButton = dialog.tabWidget.findChild('meseRadioButton');
  var trimestreRadioButton = dialog.tabWidget.findChild('trimestreRadioButton');
  var annoRadioButton = dialog.tabWidget.findChild('annoRadioButton');
  var trimestreComboBox = dialog.tabWidget.findChild('trimestreComboBox');
  var meseComboBox = dialog.tabWidget.findChild('meseComboBox');
  if (param.periodoSelezionato == 'm' && meseRadioButton)
    meseRadioButton.checked = true;
  else if (param.periodoSelezionato == 'q' && trimestreRadioButton)
    trimestreRadioButton.checked = true;
  else if (param.periodoSelezionato == 'a' && annoRadioButton)
    annoRadioButton.checked = true;
  if (meseComboBox)
    meseComboBox.currentIndex = param.periodoValoreMese;
  if (trimestreComboBox)
    trimestreComboBox.currentIndex = param.periodoValoreTrimestre;
  //Tipo registro
  var tipoRegistroComboBox = dialog.tabWidget.findChild('tipoRegistroComboBox');
  if (tipoRegistroComboBox)
    tipoRegistroComboBox.currentIndex = param.tipoRegistro;
  //Opzioni
  var visualizzaDataOraCheckBox = dialog.tabWidget.findChild('visualizzaDataOraCheckBox');
  if (visualizzaDataOraCheckBox)
    visualizzaDataOraCheckBox.checked = param.visualizzaDataOra;
  var numerazioneAutomaticaCheckBox = dialog.tabWidget.findChild('numerazioneAutomaticaCheckBox');
  if (numerazioneAutomaticaCheckBox)
    numerazioneAutomaticaCheckBox.checked = param.numerazioneAutomatica;
  var stampaDefinitivaCheckBox = dialog.tabWidget.findChild('stampaDefinitivaCheckBox');
  if (stampaDefinitivaCheckBox)
    stampaDefinitivaCheckBox.checked = param.stampaDefinitiva;
  var inizioNumerazionePagineSpinBox = dialog.tabWidget.findChild('inizioNumerazionePagineSpinBox');
  if (inizioNumerazionePagineSpinBox) {
    if (param.inizioNumerazionePagine.length>0)
      inizioNumerazionePagineSpinBox.value = parseInt(param.inizioNumerazionePagine);
    else  
      inizioNumerazionePagineSpinBox.value = 1;
  }
  //Testi
  var testoRegistriComboBox = dialog.tabWidget.findChild('testoRegistriComboBox');
  var testoGroupBox = dialog.tabWidget.findChild('testoGroupBox');
  var testoLineEdit = dialog.tabWidget.findChild('testoLineEdit');
  var tempStampaTestoRegistroAcquisti = param.stampaTestoRegistroAcquisti;
  var tempStampaTestoRegistroVendite = param.stampaTestoRegistroVendite;
  var tempStampaTestoRegistroCorrispettivi = param.stampaTestoRegistroCorrispettivi;
  var tempTestoRegistroAcquisti = param.testoRegistroAcquisti;
  var tempTestoRegistroVendite = param.testoRegistroVendite;
  var tempTestoRegistroCorrispettivi = param.testoRegistroCorrispettivi;
  var tempTestoRegistriCurrentIndex = param.testoRegistriComboBoxIndex;
  if (testoRegistriComboBox)
    testoRegistriComboBox.currentIndex = param.testoRegistriComboBoxIndex;
  if (testoGroupBox && param.testoRegistriComboBoxIndex == 0) {
    testoGroupBox.checked = tempStampaTestoRegistroAcquisti;
    testoLineEdit.setText(tempTestoRegistroAcquisti);
  }
  else if (testoGroupBox && param.testoRegistriComboBoxIndex == 1) {
    testoGroupBox.checked = tempStampaTestoRegistroVendite;
    testoLineEdit.setText(tempTestoRegistroVendite);
  }
  else if (testoGroupBox && param.testoRegistriComboBoxIndex == 2) {
    testoGroupBox.checked = tempStampaTestoRegistroCorrispettivi;
    testoLineEdit.setText(tempTestoRegistroCorrispettivi);
  }
  
  //dialog functions
  dialog.checkdata = function () {
    dialog.accept();
  }
  dialog.enableButtons = function () {
    if (meseRadioButton && meseRadioButton.checked) {
        meseComboBox.enabled = true;
        trimestreComboBox.enabled = false;
    }
    else if (trimestreRadioButton &&trimestreRadioButton.checked) {
        meseComboBox.enabled = false;
        trimestreComboBox.enabled = true;
    }
    else {
        meseComboBox.enabled = false;
        trimestreComboBox.enabled = false;
    }
    //Testi
    if (tempTestoRegistriCurrentIndex == '0') {
      tempStampaTestoRegistroAcquisti = testoGroupBox.checked;
      tempTestoRegistroAcquisti = testoLineEdit.plainText;
    }
    else if (tempTestoRegistriCurrentIndex == '1') {
      tempStampaTestoRegistroVendite = testoGroupBox.checked;
      tempTestoRegistroVendite = testoLineEdit.plainText;
    }
    else if (tempTestoRegistriCurrentIndex == '2') {
      tempStampaTestoRegistroCorrispettivi = testoGroupBox.checked;
      tempTestoRegistroCorrispettivi = testoLineEdit.plainText;
    }
    tempTestoRegistriCurrentIndex = testoRegistriComboBox.currentIndex.toString();
    testoGroupBox.checked = false;
    testoLineEdit.setText('');
    if (tempTestoRegistriCurrentIndex == '0') {
      testoGroupBox.checked = tempStampaTestoRegistroAcquisti;
      testoLineEdit.setText(tempTestoRegistroAcquisti);
    }
    else if (tempTestoRegistriCurrentIndex == '1') {
      testoGroupBox.checked = tempStampaTestoRegistroVendite;
      testoLineEdit.setText(tempTestoRegistroVendite);
    }
    else if (tempTestoRegistriCurrentIndex == '2') {
      testoGroupBox.checked = tempStampaTestoRegistroCorrispettivi;
      testoLineEdit.setText(tempTestoRegistroCorrispettivi);
    }
  }
  dialog.showHelp = function () {
    Banana.Ui.showHelp("ch.banana.script.italy_vat_2017");
  }
  dialog.buttonBox.accepted.connect(dialog, "checkdata");
  dialog.buttonBox.helpRequested.connect(dialog, "showHelp");
  testoRegistriComboBox['currentIndexChanged(QString)'].connect(dialog, "enableButtons");
  testoGroupBox.clicked.connect(dialog, "enableButtons");
  trimestreRadioButton.clicked.connect(dialog, "enableButtons");
  meseRadioButton.clicked.connect(dialog, "enableButtons");
  annoRadioButton.clicked.connect(dialog, "enableButtons");
  
  //Visualizzazione dialogo
  Banana.application.progressBar.pause();
  dialog.enableButtons();
  var dlgResult = dialog.exec();
  Banana.application.progressBar.resume();
  if (dlgResult !== 1)
    return false;

  //Salvataggio dati
  //Groupbox periodo
  if (trimestreRadioButton.checked)
    param.periodoSelezionato = 'q';
  else if (annoRadioButton.checked)
    param.periodoSelezionato = 'a';
  else
    param.periodoSelezionato = 'm';
  if (meseComboBox)
    param.periodoValoreMese = meseComboBox.currentIndex.toString();
  if (trimestreComboBox)
    param.periodoValoreTrimestre = trimestreComboBox.currentIndex.toString();
  //Tipo registro
  if (tipoRegistroComboBox)
    param.tipoRegistro = tipoRegistroComboBox.currentIndex.toString();
  //Opzioni
  if (visualizzaDataOraCheckBox)
    param.visualizzaDataOra = visualizzaDataOraCheckBox.checked;
  if (numerazioneAutomaticaCheckBox)
    param.numerazioneAutomatica = numerazioneAutomaticaCheckBox.checked;
  if (stampaDefinitivaCheckBox)
    param.stampaDefinitiva = stampaDefinitivaCheckBox.checked;
  if (inizioNumerazionePagineSpinBox)
      param.inizioNumerazionePagine = inizioNumerazionePagineSpinBox.value.toString();
  //Testi
  param.testoRegistriComboBoxIndex = testoRegistriComboBox.currentIndex.toString();
  if (param.testoRegistriComboBoxIndex == 0) {
    param.stampaTestoRegistroAcquisti = testoGroupBox.checked;
    if (param.stampaTestoRegistroAcquisti)
      param.testoRegistroAcquisti = testoLineEdit.plainText;
    param.stampaTestoRegistroVendite = tempStampaTestoRegistroVendite;
    param.testoRegistroVendite = tempTestoRegistroVendite;
    param.stampaTestoRegistroCorrispettivi = tempStampaTestoRegistroCorrispettivi;
    param.testoRegistroCorrispettivi = tempTestoRegistroCorrispettivi;
  }
  else if (param.testoRegistriComboBoxIndex == 1) {
    param.stampaTestoRegistroVendite = testoGroupBox.checked;
    if (param.stampaTestoRegistroVendite)
      param.testoRegistroVendite = testoLineEdit.plainText;
    param.stampaTestoRegistroAcquisti = tempStampaTestoRegistroAcquisti;
    param.testoRegistroAcquisti = tempTestoRegistroAcquisti;
    param.stampaTestoRegistroCorrispettivi = tempStampaTestoRegistroCorrispettivi;
    param.testoRegistroCorrispettivi = tempTestoRegistroCorrispettivi;
  }
  else if (param.testoRegistriComboBoxIndex == 2) {
    param.stampaTestoRegistroCorrispettivi = testoGroupBox.checked;
    if (param.stampaTestoRegistroCorrispettivi)
      param.testoRegistroCorrispettivi = testoLineEdit.plainText;
    param.stampaTestoRegistroAcquisti = tempStampaTestoRegistroAcquisti;
    param.testoRegistroAcquisti = tempTestoRegistroAcquisti;
    param.stampaTestoRegistroVendite = tempStampaTestoRegistroVendite;
    param.testoRegistroVendite = tempTestoRegistroVendite;
  }
  
  var paramToString = JSON.stringify(param);
  Banana.document.setScriptSettings(paramToString);
  return true;
}

function addPageHeader(report, stylesheet, param)
{
  // Page header
  var pageHeader = report.getHeader();

  //Tabella
  var table = pageHeader.addTable("header_table");
  table.addColumn("header_col_left");
  table.addColumn("header_col_right");
  
  //cell_left
  var row = table.addRow();
  var cell_left = row.addCell("", "header_cell_left");

  var line1 = param.datiContribuente.societa;
  if (line1.length)
    line1 += " ";
  if (param.datiContribuente.cognome.length)
    line1 += param.datiContribuente.cognome;
  if (param.datiContribuente.nome.length)
    line1 += param.datiContribuente.nome;
  if (line1.length)
    cell_left.addParagraph(line1);
  
  var line2 = '';
  if (param.datiContribuente.indirizzo.length)
    line2 = param.datiContribuente.indirizzo + " ";
  if (param.datiContribuente.ncivico.length)
    line2 += " " + param.datiContribuente.ncivico;
  if (line2.length)
    cell_left.addParagraph(line2);

  var line3 = '';
  if (param.datiContribuente.cap.length)
    line3 = param.datiContribuente.cap + " ";
  if (param.datiContribuente.comune.length)
    line3 += param.datiContribuente.comune + " ";
  if (param.datiContribuente.provincia.length)
    line3 += "(" +  param.datiContribuente.provincia + ")";
  if (line3.length)
    cell_left.addParagraph(line3);
  
  var line4 = '';
  if (param.datiContribuente.partitaIva.length)
    line4 = "P.IVA: " + param.datiContribuente.partitaIva;
  if (line4.length)
    cell_left.addParagraph(line4, "vatNumber");
  
  //cell_right
  var cell_right = row.addCell("", "header_cell_right");
  var paragraph = cell_right.addParagraph("pag. ", "right").addFieldPageNr();
  paragraph.addText("xxx");
 
  //add style
  stylesheet.addStyle(".header_table", "margin-top:1em;width:100%;");
  stylesheet.addStyle(".header_col_left", "width:50%");
  stylesheet.addStyle(".header_col_right", "width:49%");
  stylesheet.addStyle(".header_cell_left", "font-size:8px");
  stylesheet.addStyle(".header_cell_right", "font-size:8px");
  stylesheet.addStyle(".period", "padding-bottom: 1em;");
  stylesheet.addStyle(".right", "text-align: right;");
}

function exec(inData) {

  if (!Banana.document)
    return "@Cancel";

  // Check version
  if (typeof (Banana.document.journalCustomersSuppliers) === 'undefined') {
    var msg = getErrorMessage(ID_ERR_VERSIONE);
    msg = msg.replace("%1", "Banana.document.journalCustomersSuppliers" );
    Banana.document.addMessage( msg, ID_ERR_VERSIONE);
    return "@Cancel";
  }

  var param = {};
  if (inData.length>0) {
    param = JSON.parse(inData);
  }
  else {
    if (!settingsDialog())
      return "@Cancel";
    param = JSON.parse(Banana.document.getScriptSettings());
  }
  
  //add accounting data and journal
  param = readAccountingData(param);
  param = loadJournalData(param);

  var report = Banana.Report.newReport("Registri IVA");
  var stylesheet = Banana.Report.newStyleSheet();
  addPageHeader(report, stylesheet, param);
  setStyle(report, stylesheet);
  
  //Print data
  if (param.tipoRegistro == 3) {
    //Registro IVA unico
    for (var i=0; i<param.periods.length; i++) {
      printRegister(report, stylesheet, param.periods[i], 'Acquisti');
      report.addPageBreak();
      printRegister(report, stylesheet, param.periods[i], 'Vendite');
      report.addPageBreak();
      printRegister(report, stylesheet, param.periods[i], 'Corrispettivi');
      if (i+1<param.periods.length)
        report.addPageBreak();
    }
  }
  else {
    var tipoRegistro = '';
    if (param.tipoRegistro == 0)
      tipoRegistro = 'Acquisti';
    else if (param.tipoRegistro == 1)
      tipoRegistro = 'Vendite';
    else if (param.tipoRegistro == 2)
      tipoRegistro = 'Corrispettivi';
    for (var i=0; i<param.periods.length; i++) {
      printRegister(report, stylesheet, param.periods[i], tipoRegistro);
      if (i+1<param.periods.length)
        report.addPageBreak();
    }
  }

  //Debug
  var debug = true;
  if (debug) {
    for (var i=0; i<param.periods.length; i++) {
      report.addPageBreak();
      _debug_printJournal(param.periods[i], report, stylesheet);
    }
  }
  
  Banana.Report.preview(report, stylesheet);
  return;

}

function initParam()
{
  var param = {};

  param.tipoRegistro = 0;
  param.visualizzaDataOra = false;
  param.numerazioneAutomatica = false;
  param.stampaDefinitiva = false;
  param.inizioNumerazionePagine = 1;
  param.testoRegistriComboBoxIndex = 0;
  param.stampaTestoRegistroAcquisti = false;
  param.stampaTestoRegistroVendite = false;
  param.stampaTestoRegistroCorrispettivi = false;
  param.testoRegistroAcquisti = '';
  param.testoRegistroVendite = '';
  param.testoRegistroCorrispettivi = '';

  param.periodoSelezionato = 'm';
  param.periodoValoreMese = '';
  param.periodoValoreTrimestre = '';
  param.periodoValoreSemestre = '';

  return param;
}

function loadJournalData(param) {
  //per il momento c'è un unico periodo non controlla il tipo di versamento mensile o trimestrale
  param.datiContribuente.liqTipoVersamento = -1;
  param.periods = [];
  var periods = createPeriods(param);
  for (var i=0; i<periods.length; i++) {
    periods[i] = loadJournal(periods[i]);
    param.periods.push(periods[i]);
  }
  return param;
}

function printRegister(report, stylesheet, param, register) {
  
  //Controlla se ci sono righe da stampare
  var counter = param.journal.rows.length;
  if (register.length > 0) {
    for (var index in param.journal.rows) {
      if (typeof param.journal.rows[index] !== "object")
        continue;
      if (param.journal.rows[index].IT_Registro != register)
        continue;
      counter++;
    }
  }
  if (counter<=0)
    return;
  
  //Periodo
  report.addParagraph("IVA " + register.toUpperCase(), "title center");
  report.addParagraph("Periodo dal: " + Banana.Converter.toLocaleDateFormat(param.startDate) + " al " + Banana.Converter.toLocaleDateFormat(param.endDate), "period center");

  //Totali
  var vatRatesTotal = [];
  var vatCodesTotal = [];  
  
  //Tabella
  var table = report.addTable("register_table");
  var headerRow = table.getHeader().addRow();
  headerRow.addCell("N. Prot.", "right");
  headerRow.addCell("Data Reg.", "right");
  headerRow.addCell("Data Doc.", "right");
  headerRow.addCell("N. Doc");
  headerRow.addCell("Descrizione");
  headerRow.addCell("Totale Docum.", "right");
  headerRow.addCell("Imponibile", "right");
  headerRow.addCell("Cod.IVA", "right");
  headerRow.addCell("%", "right");
  headerRow.addCell("Imposta", "right");

  //Righe
  var totCol1=0;
  var totCol2=0;
  var totCol3=0;
  for (var index in param.journal.rows) {
    if (typeof param.journal.rows[index] !== "object")
      continue;
    if (param.journal.rows[index].IT_Registro != register)
      continue;

    //var customerObject = getAccount(param.journal.rows[index].JInvoiceAccountId);
    var progRegistro = param.journal.rows[index].DocProtocol;
    if (param.numerazioneAutomatica)
      progRegistro = param.journal.rows[index].IT_ProgRegistro;
    var vatCode = param.journal.rows[index].JVatCodeWithoutSign;
    var vatRate = param.journal.rows[index].IT_Aliquota;
    var vatAmount = param.journal.rows[index].IT_ImportoIva;
    var vatPosted = param.journal.rows[index].IT_IvaContabilizzata;
    var vatNonDed = param.journal.rows[index].VatNonDeductible;
    var vatTaxable = param.journal.rows[index].IT_Imponibile;
    var vatTaxableDed = param.journal.rows[index].IT_ImponibileDetraibile;
    var vatTaxableNonDed = param.journal.rows[index].IT_ImponibileNonDetraibile;
    var vatPercNonDed = param.journal.rows[index].VatPercentNonDeductible;

    var row = table.addRow();
    row.addCell(progRegistro, "right");
    row.addCell(Banana.Converter.toLocaleDateFormat(param.journal.rows[index].JDate, "dd/mm/yy"), "right");
    row.addCell(Banana.Converter.toLocaleDateFormat(param.journal.rows[index].JInvoiceIssueDate, "dd/mm/yy"), "right");
    row.addCell(param.journal.rows[index].IT_DocInvoice, "right");
    var cell = row.addCell();
    var descrizione = xml_unescapeString(param.journal.rows[index].IT_ClienteIntestazione);
    descrizione += " " + param.journal.rows[index].Doc;
    if (descrizione.length>1)
      cell.addParagraph(descrizione);
    if (param.journal.rows[index].Description.length>0)
      cell.addParagraph(param.journal.rows[index].Description);
    row.addCell(Banana.Converter.toLocaleNumberFormat(param.journal.rows[index].IT_Lordo), "right");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatTaxable), "right");
    row.addCell(vatCode, "right");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatRate), "right");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatAmount), "right");

    //Totali
    totCol1 = Banana.SDecimal.add(param.journal.rows[index].IT_Lordo, totCol1);
    totCol2 = Banana.SDecimal.add(vatTaxable, totCol2);
    totCol3 = Banana.SDecimal.add(vatAmount, totCol3);

    if (vatRate.length>0) {
      if (vatRatesTotal[vatRate]) {
        vatRatesTotal[vatRate].vatAmount = Banana.SDecimal.add(vatRatesTotal[vatRate].vatAmount, vatAmount);
        vatRatesTotal[vatRate].vatPosted = Banana.SDecimal.add(vatRatesTotal[vatRate].vatPosted, vatPosted);
        vatRatesTotal[vatRate].vatNonDed = Banana.SDecimal.add(vatRatesTotal[vatRate].vatNonDed, vatNonDed);
        vatRatesTotal[vatRate].vatTaxable = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxable, vatTaxable);
        vatRatesTotal[vatRate].vatTaxableDed = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxableDed, vatTaxableDed);
        vatRatesTotal[vatRate].vatTaxableNonDed = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxableNonDed, vatTaxableNonDed);
      }
      else {
        vatRatesTotal[vatRate] = {};
        vatRatesTotal[vatRate].vatAmount = vatAmount;
        vatRatesTotal[vatRate].vatPosted = vatPosted;
        vatRatesTotal[vatRate].vatNonDed = vatNonDed;
        vatRatesTotal[vatRate].vatTaxable = vatTaxable;
        vatRatesTotal[vatRate].vatTaxableDed = vatTaxableDed;
        vatRatesTotal[vatRate].vatTaxableNonDed = vatTaxableNonDed;
        vatRatesTotal[vatRate].vatPercNonDed = vatPercNonDed;
      }
    }

    if (vatCode.length>0) {
      if (vatCodesTotal[vatCode]) {
        vatCodesTotal[vatCode].vatAmount = Banana.SDecimal.add(vatCodesTotal[vatCode].vatAmount, vatAmount);
        vatCodesTotal[vatCode].vatPosted = Banana.SDecimal.add(vatCodesTotal[vatCode].vatPosted, vatPosted);
        vatCodesTotal[vatCode].vatNonDed = Banana.SDecimal.add(vatCodesTotal[vatCode].vatNonDed, vatNonDed);
        vatCodesTotal[vatCode].vatTaxable = Banana.SDecimal.add(vatCodesTotal[vatCode].vatTaxable, vatTaxable);
        vatCodesTotal[vatCode].vatTaxableDed = Banana.SDecimal.add(vatCodesTotal[vatCode].vatTaxableDed, vatTaxableDed);
        vatCodesTotal[vatCode].vatTaxableNonDed = Banana.SDecimal.add(vatCodesTotal[vatCode].vatTaxableNonDed, vatTaxableNonDed);
      }
      else {
        vatCodesTotal[vatCode] = {};
        vatCodesTotal[vatCode].vatAmount = vatAmount;
        vatCodesTotal[vatCode].vatPosted = vatPosted;
        vatCodesTotal[vatCode].vatNonDed = vatNonDed;
        vatCodesTotal[vatCode].vatTaxable = vatTaxable;
        vatCodesTotal[vatCode].vatTaxableDed = vatTaxableDed;
        vatCodesTotal[vatCode].vatTaxableNonDed = vatTaxableNonDed;
        vatCodesTotal[vatCode].vatPercNonDed = vatPercNonDed;
        vatCodesTotal[vatCode].vatRate = vatRate;
      }
    }
  }

  //Riga totale
  var row = table.addRow();
  row.addCell("", "", 4);
  row.addCell("# T O T A L E", "total bold");
  row.addCell(Banana.Converter.toLocaleNumberFormat(totCol1), "right bold");
  row.addCell(Banana.Converter.toLocaleNumberFormat(totCol2), "right bold");
  row.addCell("");
  row.addCell("");
  row.addCell(Banana.Converter.toLocaleNumberFormat(totCol3), "right bold");

  //Riepilogo IVA PER ALIQUOTA DETRAIBILE
  var row = table.addRow();
  row.addCell("", "", 4);
  var title = "#RIEPILOGO IVA " + register.toUpperCase();
  if (register == "Acquisti")
    title = "#RIEPILOGO IVA DETRAIBILE";
  row.addCell(title, "bold");
  row.addCell("", "", 5);
  var tot1=0;
  var tot2=0;
  var totNonDed = 0;
  for (var vatRate in vatRatesTotal) {
    row = table.addRow();
    row.addCell("", "", 4);
    row.addCell("IVA " + vatRate + "%");
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatRatesTotal[vatRate].vatTaxableDed), "right");
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatRate), "right");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatRatesTotal[vatRate].vatPosted), "right");
    tot1 = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxableDed, tot1);
    tot2 = Banana.SDecimal.add(vatRatesTotal[vatRate].vatPosted, tot2);
    totNonDed = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxableNonDed, totNonDed);
  }  
  row = table.addRow();
  row.addCell("", "", 4);
  row.addCell("# T O T A L E", "bold");
  row.addCell("");
  row.addCell(Banana.Converter.toLocaleNumberFormat(tot1), "right bold");
  row.addCell("");
  row.addCell("");
  row.addCell(Banana.Converter.toLocaleNumberFormat(tot2), "right bold");
  
  //Riepilogo IVA PER ALIQUOTA INDETRAIBILE (dovrebbe essere solo per acquisti)
  if (!Banana.SDecimal.isZero(totNonDed)) {
    row = table.addRow();
    row.addCell("", "", 10);
    row = table.addRow();
    row.addCell("", "", 4);
    row.addCell("#RIEPILOGO IVA INDETRAIBILE", "bold");
    row.addCell("", "", 5);
    var tot1=0;
    var tot2=0;
    for (var vatRate in vatRatesTotal) {
      row = table.addRow();
      row.addCell("", "", 4);
      row.addCell("IVA " + vatRate + "%");
      row.addCell("");
      row.addCell(Banana.Converter.toLocaleNumberFormat(vatRatesTotal[vatRate].vatTaxableNonDed), "right");
      row.addCell("");
      row.addCell(Banana.Converter.toLocaleNumberFormat(vatRate), "right");
      row.addCell(Banana.Converter.toLocaleNumberFormat(vatRatesTotal[vatRate].vatNonDed), "right");
      tot1 = Banana.SDecimal.add(vatRatesTotal[vatRate].vatTaxableNonDed, tot1);
      tot2 = Banana.SDecimal.add(vatRatesTotal[vatRate].vatNonDed, tot2);
    }  
    row = table.addRow();
    row.addCell("", "", 4);
    row.addCell("# T O T A L E", "bold");
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(tot1), "right bold");
    row.addCell("");
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(tot2), "right bold");
  }

  //Riepilogo IVA per CODICE
  row = table.addRow();
  row.addCell("", "", 10);
  row = table.addRow();
  row.addCell("", "", 4);
  row.addCell("#RIEPILOGO PER CODICE IVA", "bold");
  row.addCell("", "", 5);
  var tot1=0;
  var tot2=0;
  for (var vatCode in vatCodesTotal) {
    row = table.addRow();
    row.addCell("", "", 4);
    row.addCell(vatCode);
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatCodesTotal[vatCode].vatTaxable), "right");
    row.addCell("");
    row.addCell("");
    row.addCell(Banana.Converter.toLocaleNumberFormat(vatCodesTotal[vatCode].vatAmount), "right");
    tot1 = Banana.SDecimal.add(vatCodesTotal[vatCode].vatTaxable, tot1);
    tot2 = Banana.SDecimal.add(vatCodesTotal[vatCode].vatAmount, tot2);
  }  
  row = table.addRow();
  row.addCell("", "", 4);
  row.addCell("# T OT A L E", "bold");
  row.addCell("");
  row.addCell(Banana.Converter.toLocaleNumberFormat(tot1), "right bold");
  row.addCell("");
  row.addCell("");
  row.addCell(Banana.Converter.toLocaleNumberFormat(tot2), "right bold");

}

function setStyle(report, stylesheet) {
  if (!stylesheet) {
    stylesheet = report.newStyleSheet();
  }
  stylesheet.addStyle("@page", "size:portrait;margin:2em;font-size: 8px; ");
  stylesheet.addStyle("phead", "font-weight: bold; margin-bottom: 1em");
  stylesheet.addStyle("thead", "font-weight: bold");
  stylesheet.addStyle("td", "padding-right: 0em;");
  stylesheet.addStyle(".bold", "font-weight:bold");
  stylesheet.addStyle(".period", "padding-bottom: 1em;padding-top:0;");
  stylesheet.addStyle(".center", "text-align: center");
  stylesheet.addStyle(".right", "text-align: right");
  stylesheet.addStyle(".title", "font-weight:bold;text-decoration:underline;padding-bottom:1em;padding-top:1em;padding-bottom:0.5em;");
  stylesheet.addStyle(".total", "padding-bottom:20px;");
  stylesheet.addStyle(".warning", "color: red;");
  /*register_table*/
  stylesheet.addStyle(".register_table", "width:100%;");
}

function verifyParam(param) {
  if (!param.tipoRegistro)
    param.tipoRegistro = 0;
  if (!param.visualizzaDataOra)
    param.visualizzaDataOra = false;
  if (!param.numerazioneAutomatica)
    param.numerazioneAutomatica = false;
  if (!param.stampaDefinitiva)
    param.stampaDefinitiva = false;
  if (!param.inizioNumerazionePagine)
    param.inizioNumerazionePagine = 1;
  if (!param.testoRegistriComboBoxIndex)
    param.testoRegistriComboBoxIndex = 0;
  if (!param.stampaTestoRegistroAcquisti)
    param.stampaTestoRegistroAcquisti = false;
  if (!param.stampaTestoRegistroVendite)
    param.stampaTestoRegistroVendite = false;
  if (!param.stampaTestoRegistroCorrispettivi)
    param.stampaTestoRegistroCorrispettivi = false;
  if (!param.testoRegistroAcquisti)
    param.testoRegistroAcquisti = '';
  if (!param.testoRegistroVendite)
    param.testoRegistroVendite = '';
  if (!param.testoRegistroCorrispettivi)
   param.testoRegistroCorrispettivi = '';

   if (!param.periodoSelezionato)
    param.periodoSelezionato = 'm';
  if (!param.periodoValoreMese)
    param.periodoValoreMese = '';
  if (!param.periodoValoreTrimestre)
    param.periodoValoreTrimestre = '';
  if (!param.periodoValoreSemestre)
    param.periodoValoreSemestre = '';

  return param;
}

/**
* output integers with leading zeros
*/
function zeroPad(num, places) {
    if (num.toString().length > places)
        num = 0;
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}
