import { BrowserWindow, IpcMainInvokeEvent, ipcMain } from "electron";
import { OcrTemplatesService } from "./ocr_templates.service";
import { OcrTemplate, OcrTemplateId, OcrTemplateJson } from "../@core/domain/ocr_template/ocr_template";
import { GetOcrTemplates_Input } from "../@core/application/use_cases/ocr_template/get_ocr_template/get_ocr_templates.use_case";
import { InAppNotification } from "../common/types/in_app_notification";


export class OcrTemplatesController {

    ocrTemplatesService: OcrTemplatesService;
    mainWindow: BrowserWindow;
    overlayWindow: BrowserWindow;
    activeOcrTemplateId: OcrTemplateId | null;

    constructor( input: {
        ocrTemplatesService: OcrTemplatesService
    }) {
        this.ocrTemplatesService = input.ocrTemplatesService;
    }


    init(
        input: {
            mainWindow: BrowserWindow;
            overlayWindow: BrowserWindow;
        }
    ) {

        this.mainWindow = input.mainWindow;
        this.overlayWindow = input.overlayWindow;

        this.registersIpcHandlers();
    }

    private registersIpcHandlers() {

        ipcMain.handle( 'ocr_templates:get_active',

            async ( event: IpcMainInvokeEvent ): Promise< OcrTemplateJson | null > => {

                const template = await this.ocrTemplatesService.getActiveOcrTemplate();

                return template?.toJson() || null;
            }
        );

        ipcMain.handle( 'ocr_templates:change_active',

            async ( event: IpcMainInvokeEvent, message: OcrTemplateId | null ): Promise< OcrTemplateJson | null > => {

                const template = await this.ocrTemplatesService.changeActiveOcrTemplate( message );

                this.broadcastActiveTemplate( template );

                this.activeOcrTemplateId = template?.id || null;

                return template?.toJson() || null;
            }
        );

        ipcMain.handle( 'ocr_templates:create',
            async ( event: IpcMainInvokeEvent, message: OcrTemplateJson ): Promise< OcrTemplateJson | null > => {
                
                if ( !message ) return null;

                const template = await this.ocrTemplatesService.createOcrTemplate( message )

                return template?.toJson() || null;
            }
        );
        
        ipcMain.handle( 'ocr_templates:get',
            async ( event: IpcMainInvokeEvent, message?: GetOcrTemplates_Input ): Promise< OcrTemplateJson[] > => {

                const items = await this.ocrTemplatesService.getOcrTemplates( message || {} );
                
                return items.map( item => item.toJson() );
            }
        );

        ipcMain.handle( 'ocr_templates:delete',
            async ( event: IpcMainInvokeEvent, message: OcrTemplateId ): Promise< void > => {

                if ( message === this.activeOcrTemplateId ) {
                    this.activeOcrTemplateId = null;
                    this.broadcastActiveTemplate( null );
                }

                await this.ocrTemplatesService.deleteOcrTemplate( message );
            }
        );

        ipcMain.handle( 'ocr_templates:update', 
            async ( event: IpcMainInvokeEvent, message: OcrTemplateJson ): Promise< OcrTemplateJson | undefined > => {
                
                if ( !message ) return;

                const updatedTemplate = await this.ocrTemplatesService.updateOcrTemplate( message )
                    .catch( error => {
                        console.error( error );
                    });
                    
                const json = updatedTemplate?.toJson();

                if ( updatedTemplate?.id === this.activeOcrTemplateId )
                    this.broadcastActiveTemplate( updatedTemplate );
                
                // console.log( json?.image_base64 );

                return json;
            }
        );
    }

    private broadcastActiveTemplate( template: OcrTemplate | null ) {

        const json = template?.toJson();

        this.overlayWindow.webContents.send(
            'ocr_templates:active_template',
            json
        );

        // this.mainWindow.webContents.send(
        //     'ocr_templates:active_template',
        //     json
        // );
    }
}