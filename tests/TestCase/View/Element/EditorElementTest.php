<?php

declare(strict_types=1);

namespace Brammo\Content\Test\TestCase\View\Element;

use Cake\Core\Configure;
use Cake\TestSuite\TestCase;
use Cake\View\View;

/**
 * HTML editor element test case
 */
class EditorElementTest extends TestCase
{
    /**
     * View instance
     *
     * @var \Cake\View\View
     */
    protected View $View;

    /**
     * Editor config snapshot for tearDown
     *
     * @var array<string, mixed>|null
     */
    protected ?array $originalEditorConfig = null;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();

        $this->View = new View();
        $this->originalEditorConfig = Configure::read('Content.Editor');
        Configure::delete('Content.Editor');
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown(): void
    {
        if ($this->originalEditorConfig !== null) {
            Configure::write('Content.Editor', $this->originalEditorConfig);
        } else {
            Configure::delete('Content.Editor');
        }

        unset($this->View, $this->originalEditorConfig);
        parent::tearDown();
    }

    /**
     * Render the editor element and return the script block contents.
     *
     * @param array<string, mixed> $data Element view variables
     * @return string
     */
    protected function renderEditorScript(array $data = []): string
    {
        $this->View->element('Brammo/Content.editor', $data);

        return $this->View->fetch('script');
    }

    /**
     * Test default script loads content assets and omits the file browser
     *
     * @return void
     */
    public function testDefaultOmitsFileBrowser(): void
    {
        $script = $this->renderEditorScript();
        $css = $this->View->fetch('css');

        $this->assertStringContainsString('brammo/content/js/editor.js', $script);
        $this->assertStringContainsString('brammo/content/css/editor.css', $css);
        $this->assertStringContainsString('const cleanOnPaste = true;', $script);
        $this->assertStringContainsString('const statusBar = true;', $script);
        $this->assertStringContainsString('const tableClass = "";', $script);
        $this->assertStringContainsString('const height = 500;', $script);
        $this->assertStringNotContainsString('FileBrowser', $script);
        $this->assertStringNotContainsString('browseUrl', $script);
        $this->assertStringContainsString('Clear formatting', $script);
        $this->assertStringContainsString('Insert table', $script);
    }

    /**
     * Test Content.Editor overrides defaults
     *
     * @return void
     */
    public function testContentEditorConfigOverridesDefaults(): void
    {
        Configure::write('Content.Editor', [
            'height' => 320,
            'cleanOnPaste' => false,
            'statusBar' => false,
            'tableClass' => 'table table-bordered',
        ]);

        $script = $this->renderEditorScript();

        $this->assertStringContainsString('const height = 320;', $script);
        $this->assertStringContainsString('const cleanOnPaste = false;', $script);
        $this->assertStringContainsString('const statusBar = false;', $script);
        $this->assertStringContainsString('const tableClass = "table table-bordered";', $script);
        $this->assertStringNotContainsString('FileBrowser', $script);
    }

    /**
     * Test view variables win over Content.Editor
     *
     * @return void
     */
    public function testViewVarsOverrideContentEditorConfig(): void
    {
        Configure::write('Content.Editor', [
            'height' => 320,
            'cleanOnPaste' => false,
        ]);

        $script = $this->renderEditorScript([
            'height' => 640,
            'cleanOnPaste' => true,
        ]);

        $this->assertStringContainsString('const height = 640;', $script);
        $this->assertStringContainsString('const cleanOnPaste = true;', $script);
    }

    /**
     * Test browse URLs enable the file browser
     *
     * @return void
     */
    public function testBrowseUrlsEnableFileBrowser(): void
    {
        $script = $this->renderEditorScript([
            'imagesUrl' => '/admin/file-manager/browse-images',
            'filesUrl' => '/admin/file-manager/browse-files',
            'folder' => 'photos',
            'linkFolder' => 'docs',
        ]);

        $this->assertStringContainsString('new FileBrowser(', $script);
        $this->assertStringContainsString('browseUrl: browseUrl', $script);
        $this->assertStringContainsString('\/admin\/file-manager\/browse-images', $script);
        $this->assertStringContainsString('filesBrowseUrl: filesBrowseUrl', $script);
        $this->assertStringContainsString('\/admin\/file-manager\/browse-files', $script);
        $this->assertStringContainsString('folder: "photos"', $script);
        $this->assertStringContainsString('linkFolder: "docs"', $script);
    }

    /**
     * Test a single browse URL does not enable the file browser
     *
     * @return void
     */
    public function testPartialBrowseUrlsStayDisabled(): void
    {
        $script = $this->renderEditorScript([
            'imagesUrl' => '/admin/file-manager/browse-images',
        ]);

        $this->assertStringNotContainsString('FileBrowser', $script);
        $this->assertStringNotContainsString('browseUrl', $script);
    }
}
