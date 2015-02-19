<?php
/**
 * User: Damian
 * Date: 19/05/14
 * Time: 6:05 AM
 */

namespace damiandennis\koactiveform;

use damiandennis\knockoutjs\AssetBundle;

class ModelAsset extends AssetBundle
{
    public function init()
    {
        $this->setSourcePath('@koactiveform/assets/js');
        $this->setupAssets('js', ['yii.koActiveForm', 'Model', 'BaseModel', 'custom-components']);
        parent::init();
    }
}