<?php
/**
 * Created by PhpStorm.
 * User: damian
 * Date: 13/02/15
 * Time: 9:25 PM
 */

namespace damiandennis\koactiverecord;

use yii\base\View;
use yii\base\Widget;
use yii\helpers\Html;

class KOActiveRecord extends Widget
{
    public function init()
    {
        parent::init();
        $this->registerPluginAssets();
        ob_start();
    }

    public function run()
    {
        parent::init();
        $content = ob_get_clean();
        $wrapper = Html::tag('div', $content, ['id' => $this->id]);
        return $wrapper;
    }

    /**
     * Registers the needed assets
     */
    public function registerPluginAssets()
    {
        $view = $this->getView();
        $view->registerJs(
            "
            $(function() {
                //var test;
                //ko.punches.enableAll();
                //test = new Model.UserModel();
                //ko.applyBindings(test, $('#test')[0]);
            });
            \n",
            View::POS_END
        );
    }
}
