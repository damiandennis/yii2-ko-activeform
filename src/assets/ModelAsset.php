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
    public $depends = [
        'damiandennis\knockoutjs\KnockoutAsset',
        'damiandennis\knockoutjs\KOMappingAsset',
        'damiandennis\knockoutjs\KOValidationAsset',
        'damiandennis\knockoutjs\LoDashAsset'
    ];

    public function init()
    {
        $this->setSourcePath('@koactiveform/assets/js');
        $this->setupAssets('js', [
            'yii.koActiveForm',
            'Model',
            'Model.Base',
            'ko.components.koActiveForm'
        ]);
        parent::init();
    }
}