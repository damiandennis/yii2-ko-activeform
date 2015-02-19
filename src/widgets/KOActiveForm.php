<?php
/**
 * Created by PhpStorm.
 * User: damian
 * Date: 13/02/15
 * Time: 9:25 PM
 */

namespace damiandennis\koactiveform;

use damiandennis\knockoutjs\KO;
use damiandennis\knockoutjs\KOMappingAsset;
use damiandennis\knockoutjs\KOValidationAsset;
use damiandennis\knockoutjs\LoDashAsset;
use Yii;
use yii\base\Model;
use yii\base\Widget;
use yii\helpers\Html;
use yii\helpers\Json;
use yii\web\View;

class KOActiveRecord extends Widget
{
    public $models;

    public function init()
    {
        parent::init();

        Yii::setAlias('@koactiveform', dirname(__FILE__).'/../');

        if ($this->models === null || !is_array($this->models)) {
            throw new \Exception(
                'models is a required parameter and must be an associative array.'
            );
        }

        if (is_array($this->models)) {
            foreach ($this->models as $model => $data) {
                $this->validateParams($model, $data);
            }
        }

        $this->registerPluginAssets();
        ob_start();
    }

    public function validateParams($model, &$data)
    {
        if ($model === null) {
            throw new \Exception('data is a required parameter.');
        }

        if (is_string($data) && !KO::validJson($data)) {
            throw new \Exception('data must be a valid json string.');
        }

        if (is_string($data)) {
            $data = Json::decode($data, true);
        }

        if (is_object($data) && is_a($data, 'yii\base\Model')) {
            $data = $data->attributes;
        } elseif (is_object($data)) {
            throw new \Exception('data must be object that inherits yii\base\Model class.');
        }
    }

    public function run()
    {
        parent::init();
        $content = ob_get_clean();
        $wrapper = Html::tag('div', $content, ['id' => $this->id]);
        return KO::beginVirtual('stopBinding: true')."{$wrapper}".KO::endVirtual();
    }

    /**
     * Registers the needed assets
     */
    public function registerPluginAssets()
    {

        $view = $this->getView();
        KOMappingAsset::register($view);
        LoDashAsset::register($view);
        KOValidationAsset::register($view);
        ModelAsset::register($view);

        $data = Json::encode($this->models);
        $view->registerJs(
            "
            $(function() {
                yii.koActiveForm.setBinding('{$this->id}', {$data});
            });
            \n",
            View::POS_END
        );
    }
}
