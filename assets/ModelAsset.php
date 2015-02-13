<?php
/**
 * User: Damian
 * Date: 19/05/14
 * Time: 6:05 AM
 */

namespace damiandennis\koactiverecord;

use damiandennis\knockoutjs\AssetBundle;

class KnockoutListAsset extends AssetBundle
{
    public function init()
    {
        $this->setSourcePath('@koactiverecord/assets/js');
        $this->setupAssets('js', ['Model', 'BaseModel']);
        parent::init();
    }
}