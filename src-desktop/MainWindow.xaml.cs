using System;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;
using Microsoft.Web.WebView2.Core;

namespace FretTabRunnerDesktop;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();

        try
        {
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico");
            if (File.Exists(iconPath))
            {
                Icon = BitmapFrame.Create(new Uri(iconPath, UriKind.Absolute));
            }
        }
        catch { }

        Loaded += MainWindow_Loaded;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        try
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string distDir = Path.Combine(baseDir, "dist");

            // Fallbacks for dev / alternative paths
            if (!Directory.Exists(distDir))
            {
                string devDist = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "dist"));
                if (Directory.Exists(devDist))
                {
                    distDir = devDist;
                }
                else
                {
                    string rootDist = Path.GetFullPath(Path.Combine(baseDir, "..", "dist"));
                    if (Directory.Exists(rootDist))
                    {
                        distDir = rootDist;
                    }
                }
            }

            string userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "FretTabRunner",
                "WebView2Data"
            );
            Directory.CreateDirectory(userDataFolder);

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await webView.EnsureCoreWebView2Async(env);

            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true;

            if (Directory.Exists(distDir))
            {
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "app.frettabrunner.local",
                    distDir,
                    CoreWebView2HostResourceAccessKind.Allow
                );
                webView.CoreWebView2.Navigate("https://app.frettabrunner.local/index.html");
            }
            else
            {
                webView.CoreWebView2.Navigate("http://localhost:1420");
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Error initializing FretTabRunner Desktop: {ex.Message}",
                "FretTabRunner Error",
                MessageBoxButton.OK,
                MessageBoxImage.Error
            );
        }
    }
}
