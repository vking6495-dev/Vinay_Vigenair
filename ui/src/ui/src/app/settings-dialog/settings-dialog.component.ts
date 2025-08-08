import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SavedSettingsDialogComponent } from './saved-settings-dialog/saved-settings-dialog.component';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
    SavedSettingsDialogComponent,
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.css',
})
export class SettingsDialogComponent implements OnInit {
  brandName = '';
  logoPreview = '';
  primaryColor = '#3f51b5';
  currentBrandName = '';
  currentLogo = '';
  currentPrimaryColor = '#3f51b5';
  fillWithPreviousSettings = false;

  @ViewChild('logoInput') logoInput!: ElementRef;

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    private dialog: MatDialog
  ) {
    this.loadPersonalizationSettings();
  }

  ngOnInit() {}

  openSavedSettingsDialog() {
    this.dialog.open(SavedSettingsDialogComponent, {
      width: '600px',
      data: { currentSettings: {
        brandName: this.brandName,
        logo: this.logoPreview,
        primaryColor: this.primaryColor,
      } },
    }).afterClosed().subscribe(result => {
      if (result?.applied && result.settings) {
        this.brandName = result.settings.brandName;
        this.logoPreview = result.settings.logo;
        this.primaryColor = result.settings.primaryColor;
        this.currentBrandName = result.settings.brandName;
        this.currentLogo = result.settings.logo;
        this.currentPrimaryColor = result.settings.primaryColor;
        this.applyDynamicTheme();
      }
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveSettings() {
    const settings = {
      brandName: this.brandName,
      logo: this.logoPreview,
      primaryColor: this.primaryColor,
    };
    localStorage.setItem('uiPersonalizationSettings', JSON.stringify(settings));
    let list = this.getSavedSettingsList();
    list.push(settings);
    localStorage.setItem('uiSavedSettingsList', JSON.stringify(list));
    this.snackBar.open('Settings saved successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
    });
    this.currentBrandName = this.brandName;
    this.currentLogo = this.logoPreview;
    this.currentPrimaryColor = this.primaryColor;
    this.applyDynamicTheme();
    this.dialogRef.close();
  }

  resetSettings() {
    localStorage.removeItem('uiPersonalizationSettings');
    this.brandName = '';
    this.logoPreview = '';
    this.primaryColor = '#3f51b5';
    this.currentBrandName = '';
    this.currentLogo = '';
    this.currentPrimaryColor = '#3f51b5';
    this.fillWithPreviousSettings = false;
    this.applyDynamicTheme();
    this.snackBar.open('Settings reset to default!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
    });
    this.dialogRef.close();
  }

  getSavedSettingsList() {
    const list = localStorage.getItem('uiSavedSettingsList');
    return list ? JSON.parse(list) : [];
  }

  loadPersonalizationSettings() {
    const savedSettings = localStorage.getItem('uiPersonalizationSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.currentBrandName = settings.brandName || '';
      this.currentLogo = settings.logo || '';
      this.currentPrimaryColor = settings.primaryColor || '#3f51b5';
      this.applyDynamicTheme();
    }
  }

  applyDynamicTheme() {
    let styleElement = document.getElementById('dynamic-theme-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'dynamic-theme-styles';
      document.head.appendChild(styleElement);
    }
    const color = this.currentPrimaryColor || '#3f51b5';
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    const rgb = hexToRgb(color);
    if (rgb) {
      styleElement.innerHTML = `
        :root {
          --primary-color: ${color};
          --primary-color-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
        }
        .mat-toolbar.mat-primary {
          background-color: ${color} !important;
        }
        .mat-button.mat-primary,
        .mat-icon-button.mat-primary,
        .mat-stroked-button.mat-primary {
          color: ${color} !important;
        }
        .mat-flat-button.mat-primary,
        .mat-raised-button.mat-primary,
        .mat-fab.mat-primary,
        .mat-mini-fab.mat-primary {
          background-color: ${color} !important;
        }
        .mat-stroked-button.mat-primary {
          border-color: ${color} !important;
        }
        .mat-form-field.mat-focused .mat-form-field-label {
          color: ${color} !important;
        }
        .mat-form-field.mat-focused .mat-form-field-ripple {
          background-color: ${color} !important;
        }
        .mat-checkbox-checked .mat-checkbox-background {
          background-color: ${color} !important;
        }
        .mat-button-toggle-checked {
          background-color: ${color} !important;
          color: #fff !important;
        }
      `;
    }
  }
}
