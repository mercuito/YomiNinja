import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";
import OcrTemplatesTable from "./OcrTemplatesTable";
import { useContext, useEffect, useRef, useState } from "react";
import { OcrTemplatesContext } from "../../context/ocr_templates.provider";
import CreateOcrTemplateModal from "./CreateOcrTemplateModal";
import OcrTargetRegion from "./OcrTargetRegion";
import { OcrTargetRegionJson } from "../../../electron-src/@core/domain/ocr_template/ocr_target_region/ocr_target_region";
import Selecto, { OnSelectEnd } from "react-selecto";
import Moveable from "react-moveable";

export type Size = { // Pixels
    width: number;
    height: number;
};

export type Position = { // Pixels
    top: number;
    left: number;
};

export default function OcrTemplates() {

    const {
        ocrTemplates,
        activeOcrTemplate,
        addTargetRegion,
        removeTargetRegion,
        updateTargetRegion,
    } = useContext( OcrTemplatesContext );

    const [
        openCreateOcrTemplateModal,
        setOpenCreateOcrTemplateModal
    ] = useState(false);

    const imgRef = useRef<HTMLImageElement>(null);
    const [ templateSize, setTemplateSize ] = useState< Size >();

    const [ selectedTargetRegion, setSelectedTargetRegion ] = useState< OcrTargetRegionJson | null >();

    const moveableRef = useRef<Moveable>(null);

    useEffect(() => {
        window.onresize = handleWindowResize;
    }, []);
    

    function getTemplateRect(): DOMRect {
        return imgRef.current.getClientRects()[0];
    }

    function handleWindowResize() {

        if ( !imgRef?.current )
            return;

        const rect = getTemplateRect();

        setTemplateSize({
            width: rect.width,
            height: rect.height,
        });
    }


    useEffect( () => {

        const handleKeyDown = ( e: KeyboardEvent ) => {

            if ( 
                !selectedTargetRegion?.id ||
                e.key !== 'Delete'
            ) return;
            
            removeTargetRegion( selectedTargetRegion.id );
        }

        document.addEventListener( 'keydown', handleKeyDown );

        return () => {
            document.removeEventListener( 'keydown', handleKeyDown );
        };
    }, [ selectedTargetRegion ] );


    return <>
        <Card variant="elevation" sx={{ borderRadius: 4, userSelect: 'none', width: '100%' }}>

            <CreateOcrTemplateModal
                open={openCreateOcrTemplateModal}
                handleClose={ () => setOpenCreateOcrTemplateModal(false) }
            />

            <CardContent>
                <Container maxWidth='xl'>

                    <Box sx={{ flexGrow: 1, margin: 1, mb: 2 }}>

                        {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }} m={2} ml={0} mr={0}>
                            <Typography gutterBottom variant="h6" component="div" margin={0} ml={0} mb={4}>
                                OCR Templates
                            </Typography>
                        </Box> */}

                        <Button variant="outlined"
                            onClick={ () => setOpenCreateOcrTemplateModal( true ) }
                            sx={{ mb: 2 }}
                        >
                            New Template
                        </Button>

                        <Box display='flex' justifyContent='center' flexDirection='column'>

                            <Typography
                                visibility={ activeOcrTemplate ? 'unset' : 'hidden' }
                                textAlign='center'
                            >
                                {activeOcrTemplate?.name}
                            </Typography>

                            { activeOcrTemplate &&
                                <div id='ocr-template-div' className='ocr-template-div'
                                    onResize={ console.log }
                                    style={{
                                        display: 'flex',
                                        position: 'relative',
                                        maxWidth: '100%',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        margin: 'auto',
                                    }}>

                                    { templateSize &&
                                        activeOcrTemplate?.target_regions.map( ( region, idx ) => {
                                            return <OcrTargetRegion
                                                ocrTemplateElementId="ocr-template-div"
                                                moveableRef={moveableRef}
                                                key={idx}
                                                region={region}
                                                templateSize={templateSize}
                                                onChange={ updateTargetRegion }
                                                isSelected={ selectedTargetRegion?.id === region.id }
                                            />
                                        }) 
                                    }
                                    

                                    <img src={ 'data:image/png;base64,' + activeOcrTemplate?.image_base64 }
                                        ref={imgRef}
                                        alt="template background image"
                                        draggable={false}
                                        onLoad={handleWindowResize}
                                        style={{
                                            top: 0,
                                            left: 0,
                                            maxWidth: '100%',
                                            maxHeight: '75vh',
                                            userSelect: 'none',
                                            objectFit: 'cover', 
                                        }}
                                    />
                                </div>
                                
                            }

                            <Selecto
                                selectableTargets={[".ocr-template-div .ocr-region"]}
                                selectByClick={true}
                                selectFromInside={false}
                                continueSelect={false}
                                toggleContinueSelect={"shift"}
                                keyContainer={window}
                                hitRate={100}
                                boundContainer={ document.getElementById( 'ocr-template-div' ) }
                                onSelectEnd={ e => {

                                    // console.log( e );

                                    let didSelectARegion = false;

                                    activeOcrTemplate.target_regions?.find( item => {

                                        const element = e.selected.find( element => element.id === item.id );
                                        if ( !element ) return;

                                        setSelectedTargetRegion( item );

                                        didSelectARegion = true;
                                        
                                        return true;
                                    });

                                    if ( !didSelectARegion )
                                        setSelectedTargetRegion( null );
                                    else 
                                        return;

                                    const selectionRect = e.rect;
                                    const templateRect = getTemplateRect();
                                    
                                    const width = selectionRect.width / templateRect.width;
                                    const height = selectionRect.height / templateRect.height;

                                    const top = ( selectionRect.top - templateRect.top ) / templateRect.height;
                                    const left = ( selectionRect.left - templateRect.left ) / templateRect.width;

                                    if ( width < 0.025 || height < 0.025 )
                                        return;
                                    
                                    addTargetRegion({
                                        ocr_template_id: activeOcrTemplate.id,
                                        position: {
                                            top,
                                            left,
                                        },
                                        size: {
                                            width,
                                            height,
                                        },
                                        angle: 0,
                                    });
                                }}
                
                            />
                        </Box>

                        <OcrTemplatesTable templates={ocrTemplates} />

                    </Box>

                </Container>
            </CardContent>
        </Card>
    </>
}