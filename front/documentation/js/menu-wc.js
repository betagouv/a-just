'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">a-just-front documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/CGUPageModule.html" data-type="entity-link" >CGUPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HeaderSelectorsModule.html" data-type="entity-link" >HeaderSelectorsModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SituationDisplayerModule.html" data-type="entity-link" >SituationDisplayerModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AboutUsPage.html" data-type="entity-link" >AboutUsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/AccessibilitiesPage.html" data-type="entity-link" >AccessibilitiesPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivitiesLastDisponibilitiesComponent.html" data-type="entity-link" >ActivitiesLastDisponibilitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivitiesLastModificationsComponent.html" data-type="entity-link" >ActivitiesLastModificationsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivitiesPage.html" data-type="entity-link" >ActivitiesPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivitiesToCompleteComponent.html" data-type="entity-link" >ActivitiesToCompleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActualPanelSituationComponent.html" data-type="entity-link" >ActualPanelSituationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddVentilationComponent.html" data-type="entity-link" >AddVentilationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AlertComponent.html" data-type="entity-link" >AlertComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AlertSmallComponent.html" data-type="entity-link" >AlertSmallComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AverageEtpDisplayerPage.html" data-type="entity-link" >AverageEtpDisplayerPage</a>
                            </li>
                            <li class="link">
                                <a href="components/AverageEtpPage.html" data-type="entity-link" >AverageEtpPage</a>
                            </li>
                            <li class="link">
                                <a href="components/BackButtonComponent.html" data-type="entity-link" >BackButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BigEtpPreviewComponent.html" data-type="entity-link" >BigEtpPreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BigLoaderComponent.html" data-type="entity-link" >BigLoaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CalculatorPage.html" data-type="entity-link" >CalculatorPage</a>
                            </li>
                            <li class="link">
                                <a href="components/CalculatriceComponent.html" data-type="entity-link" >CalculatriceComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CGUPage.html" data-type="entity-link" >CGUPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ChangePassword.html" data-type="entity-link" >ChangePassword</a>
                            </li>
                            <li class="link">
                                <a href="components/CheckboxComponent.html" data-type="entity-link" >CheckboxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChooseSimulatorComponent.html" data-type="entity-link" >ChooseSimulatorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentActivitiesComponent.html" data-type="entity-link" >CommentActivitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentProfilComponent.html" data-type="entity-link" >CommentProfilComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CompletionBarComponent.html" data-type="entity-link" >CompletionBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContactPage.html" data-type="entity-link" >ContactPage</a>
                            </li>
                            <li class="link">
                                <a href="components/CoveragePreviewComponent.html" data-type="entity-link" >CoveragePreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CoverProfilDetailsComponent.html" data-type="entity-link" >CoverProfilDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardPage.html" data-type="entity-link" >DashboardPage</a>
                            </li>
                            <li class="link">
                                <a href="components/DateSelectBlueComponent.html" data-type="entity-link" >DateSelectBlueComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DateSelectComponent.html" data-type="entity-link" >DateSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialWidgetComponent.html" data-type="entity-link" >DialWidgetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DocCardComponent.html" data-type="entity-link" >DocCardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DtesChartComponent.html" data-type="entity-link" >DtesChartComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditableSituationComponent.html" data-type="entity-link" >EditableSituationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EmptyInputComponent.html" data-type="entity-link" >EmptyInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EtpChartComponent.html" data-type="entity-link" >EtpChartComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EtpPreviewComponent.html" data-type="entity-link" >EtpPreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ExtractorActivityComponent.html" data-type="entity-link" >ExtractorActivityComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ExtractorVentilationComponent.html" data-type="entity-link" >ExtractorVentilationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FiguresWidgetComponent.html" data-type="entity-link" >FiguresWidgetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterPanelComponent.html" data-type="entity-link" >FilterPanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterNoConnectedComponent.html" data-type="entity-link" >FooterNoConnectedComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForgotPassword.html" data-type="entity-link" >ForgotPassword</a>
                            </li>
                            <li class="link">
                                <a href="components/GraphsNumbersComponent.html" data-type="entity-link" >GraphsNumbersComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GraphsProgressComponent.html" data-type="entity-link" >GraphsProgressComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GraphsVerticalsLinesComponent.html" data-type="entity-link" >GraphsVerticalsLinesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpButtonComponent.html" data-type="entity-link" >HelpButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpCenterPage.html" data-type="entity-link" >HelpCenterPage</a>
                            </li>
                            <li class="link">
                                <a href="components/HomePage.html" data-type="entity-link" >HomePage</a>
                            </li>
                            <li class="link">
                                <a href="components/HumanResourcePage.html" data-type="entity-link" >HumanResourcePage</a>
                            </li>
                            <li class="link">
                                <a href="components/IndispoProfilComponent.html" data-type="entity-link" >IndispoProfilComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InOutChartComponent.html" data-type="entity-link" >InOutChartComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InputAdditionComponent.html" data-type="entity-link" >InputAdditionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InputButtonComponent.html" data-type="entity-link" >InputButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InputPercentageComponent.html" data-type="entity-link" >InputPercentageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/IntroJSComponent.html" data-type="entity-link" >IntroJSComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/JuridictionsInstalledPage.html" data-type="entity-link" >JuridictionsInstalledPage</a>
                            </li>
                            <li class="link">
                                <a href="components/LegaleNoticePage.html" data-type="entity-link" >LegaleNoticePage</a>
                            </li>
                            <li class="link">
                                <a href="components/LegendLabelComponent.html" data-type="entity-link" >LegendLabelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ListSelectionComponent.html" data-type="entity-link" >ListSelectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoadersWidgetComponent.html" data-type="entity-link" >LoadersWidgetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginPage.html" data-type="entity-link" >LoginPage</a>
                            </li>
                            <li class="link">
                                <a href="components/LogoutPage.html" data-type="entity-link" >LogoutPage</a>
                            </li>
                            <li class="link">
                                <a href="components/NewsComponent.html" data-type="entity-link" >NewsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OneCommentComponent.html" data-type="entity-link" >OneCommentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OptionsBackupPanelComponent.html" data-type="entity-link" >OptionsBackupPanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanelActivitiesComponent.html" data-type="entity-link" >PanelActivitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanelActivitiesComponent-1.html" data-type="entity-link" >PanelActivitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanelHistoryVentilationComponent.html" data-type="entity-link" >PanelHistoryVentilationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanoramaAlertComponent.html" data-type="entity-link" >PanoramaAlertComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanoramaPage.html" data-type="entity-link" >PanoramaPage</a>
                            </li>
                            <li class="link">
                                <a href="components/PassedCommentComponent.html" data-type="entity-link" >PassedCommentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PeriodSelectorComponent.html" data-type="entity-link" >PeriodSelectorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PersonPreviewComponent.html" data-type="entity-link" >PersonPreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PopinEditActivitiesComponent.html" data-type="entity-link" >PopinEditActivitiesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PopinGraphsDetailsComponent.html" data-type="entity-link" >PopinGraphsDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PopupComponent.html" data-type="entity-link" >PopupComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PrivacyPage.html" data-type="entity-link" >PrivacyPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgressionBarComponent.html" data-type="entity-link" >ProgressionBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RadioButtonComponent.html" data-type="entity-link" >RadioButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReaffectatorPage.html" data-type="entity-link" >ReaffectatorPage</a>
                            </li>
                            <li class="link">
                                <a href="components/RecordsUpdateComponent.html" data-type="entity-link" >RecordsUpdateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReferentielCalculatorComponent.html" data-type="entity-link" >ReferentielCalculatorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectCheckAllComponent.html" data-type="entity-link" >SelectCheckAllComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectComponent.html" data-type="entity-link" >SelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SignupPage.html" data-type="entity-link" >SignupPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SimulatorPage.html" data-type="entity-link" >SimulatorPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SiteMapPage.html" data-type="entity-link" >SiteMapPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SituationDisplayerComponent.html" data-type="entity-link" >SituationDisplayerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SpeedometerComponent.html" data-type="entity-link" >SpeedometerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StatsPage.html" data-type="entity-link" >StatsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/TemplateAnalyticsComponent.html" data-type="entity-link" >TemplateAnalyticsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TextEditorComponent.html" data-type="entity-link" >TextEditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TimeSelectorComponent.html" data-type="entity-link" >TimeSelectorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TooltipsComponent.html" data-type="entity-link" >TooltipsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewAnalyticsComponent.html" data-type="entity-link" >ViewAnalyticsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WelcomePage.html" data-type="entity-link" >WelcomePage</a>
                            </li>
                            <li class="link">
                                <a href="components/WhiteSimulatorPage.html" data-type="entity-link" >WhiteSimulatorPage</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkforceChangeComponent.html" data-type="entity-link" >WorkforceChangeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkforceCompositionComponent.html" data-type="entity-link" >WorkforceCompositionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkforcePage.html" data-type="entity-link" >WorkforcePage</a>
                            </li>
                            <li class="link">
                                <a href="components/WrapperComponent.html" data-type="entity-link" >WrapperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WrapperNoConnectedComponent.html" data-type="entity-link" >WrapperNoConnectedComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/MainClass.html" data-type="entity-link" >MainClass</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ActivitiesPermissionsService.html" data-type="entity-link" >ActivitiesPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ActivitiesService.html" data-type="entity-link" >ActivitiesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AllSimulatorPermissionsService.html" data-type="entity-link" >AllSimulatorPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BackupSettingsService.html" data-type="entity-link" >BackupSettingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CalculatorService.html" data-type="entity-link" >CalculatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CalculatriceService.html" data-type="entity-link" >CalculatriceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CockpitPermissionsService.html" data-type="entity-link" >CockpitPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommentService.html" data-type="entity-link" >CommentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentieuxOptionsService.html" data-type="entity-link" >ContentieuxOptionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardPermissionsService.html" data-type="entity-link" >DashboardPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExcelService.html" data-type="entity-link" >ExcelService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRCategoryService.html" data-type="entity-link" >HRCategoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRCommentService.html" data-type="entity-link" >HRCommentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRFonctionService.html" data-type="entity-link" >HRFonctionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HttpService.html" data-type="entity-link" >HttpService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HumanResourceService.html" data-type="entity-link" >HumanResourceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JuridictionsService.html" data-type="entity-link" >JuridictionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KPIService.html" data-type="entity-link" >KPIService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NewsService.html" data-type="entity-link" >NewsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PermissionsService.html" data-type="entity-link" >PermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReaffectatorPermissionsService.html" data-type="entity-link" >ReaffectatorPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReaffectatorService.html" data-type="entity-link" >ReaffectatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReferentielService.html" data-type="entity-link" >ReferentielService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServerService.html" data-type="entity-link" >ServerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SimulatorPermissionsService.html" data-type="entity-link" >SimulatorPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SimulatorService.html" data-type="entity-link" >SimulatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SSOService.html" data-type="entity-link" >SSOService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TempsMoyensPermissionsService.html" data-type="entity-link" >TempsMoyensPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TypeGuardService.html" data-type="entity-link" >TypeGuardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VentilationsPermissionsService.html" data-type="entity-link" >VentilationsPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WhiteSimulatorPermissionsService.html" data-type="entity-link" >WhiteSimulatorPermissionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkforceService.html" data-type="entity-link" >WorkforceService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActionsInterface.html" data-type="entity-link" >ActionsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActivityByHuman.html" data-type="entity-link" >ActivityByHuman</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActivityInterface.html" data-type="entity-link" >ActivityInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlertInterface.html" data-type="entity-link" >AlertInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnalyticsLine.html" data-type="entity-link" >AnalyticsLine</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackupInterface.html" data-type="entity-link" >BackupInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackupSettingInterface.html" data-type="entity-link" >BackupSettingInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CalculatorInterface.html" data-type="entity-link" >CalculatorInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CalculatriceInterface.html" data-type="entity-link" >CalculatriceInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/categoryButtonsInterface.html" data-type="entity-link" >categoryButtonsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChartAnnotationBoxInterface.html" data-type="entity-link" >ChartAnnotationBoxInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/childrenInterface.html" data-type="entity-link" >childrenInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/cleInterface.html" data-type="entity-link" >cleInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommentInterface.html" data-type="entity-link" >CommentInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielActivitiesInterface.html" data-type="entity-link" >ContentieuReferentielActivitiesInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielCalculateInterface.html" data-type="entity-link" >ContentieuReferentielCalculateInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielInterface.html" data-type="entity-link" >ContentieuReferentielInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuxOptionsInterface.html" data-type="entity-link" >ContentieuxOptionsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuxSelected.html" data-type="entity-link" >ContentieuxSelected</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/dataInterface.html" data-type="entity-link" >dataInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DateSelectorinterface.html" data-type="entity-link" >DateSelectorinterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocCardInterface.html" data-type="entity-link" >DocCardInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocumentationInterface.html" data-type="entity-link" >DocumentationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/etpAffectedInterface.html" data-type="entity-link" >etpAffectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExportPDFInterface.html" data-type="entity-link" >ExportPDFInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilterPanelInterface.html" data-type="entity-link" >FilterPanelInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryInterface.html" data-type="entity-link" >HistoryInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRCategoryInterface.html" data-type="entity-link" >HRCategoryInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRCategorypositionInterface.html" data-type="entity-link" >HRCategorypositionInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRCategorySelectedInterface.html" data-type="entity-link" >HRCategorySelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRFonctionInterface.html" data-type="entity-link" >HRFonctionInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRSituationInterface.html" data-type="entity-link" >HRSituationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceInterface.html" data-type="entity-link" >HumanResourceInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceIsInInterface.html" data-type="entity-link" >HumanResourceIsInInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceSelectedInterface.html" data-type="entity-link" >HumanResourceSelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceSelectedInterface-1.html" data-type="entity-link" >HumanResourceSelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/importedSituation.html" data-type="entity-link" >importedSituation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/importedVentillation.html" data-type="entity-link" >importedVentillation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IntroJSStep.html" data-type="entity-link" >IntroJSStep</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ItemInterface.html" data-type="entity-link" >ItemInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IWorkforcePanorama.html" data-type="entity-link" >IWorkforcePanorama</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JuridictionInterface.html" data-type="entity-link" >JuridictionInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedInterface.html" data-type="entity-link" >listFormatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedInterface-1.html" data-type="entity-link" >listFormatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedWithDatasInterface.html" data-type="entity-link" >listFormatedWithDatasInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedWithDatasInterface-1.html" data-type="entity-link" >listFormatedWithDatasInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listToPrintInterface.html" data-type="entity-link" >listToPrintInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsInterface.html" data-type="entity-link" >NewsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeActivityUpdatedInterface.html" data-type="entity-link" >NodeActivityUpdatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/periodInterface.html" data-type="entity-link" >periodInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RHActivityInterface.html" data-type="entity-link" >RHActivityInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulationInterface.html" data-type="entity-link" >SimulationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulatorInterface.html" data-type="entity-link" >SimulatorInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/sortButtonsInterface.html" data-type="entity-link" >sortButtonsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TagInterface.html" data-type="entity-link" >TagInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TagMonthInterface.html" data-type="entity-link" >TagMonthInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateInterface.html" data-type="entity-link" >UpdateInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInterface.html" data-type="entity-link" >UserInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/webinaire.html" data-type="entity-link" >webinaire</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/DateAgoPipe.html" data-type="entity-link" >DateAgoPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeHtmlPipe.html" data-type="entity-link" >SanitizeHtmlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeResourceUrlPipe.html" data-type="entity-link" >SanitizeResourceUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeStylePipe.html" data-type="entity-link" >SanitizeStylePipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeUrlPipe.html" data-type="entity-link" >SanitizeUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/UcFirstPipe.html" data-type="entity-link" >UcFirstPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});